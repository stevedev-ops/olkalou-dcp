from rest_framework.decorators import api_view, permission_classes

from django.utils import timezone
from datetime import timedelta
from rest_framework import status, views, response, generics
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q
from .models import Member, Invite, VoterRecord, CanvassAssignment, TransportRequest, PollingAgent, TallyRecord, IncidentReport, PhoneBankTarget, CallRecord, EmergencyBroadcast
from .serializers import MemberSerializer, InviteSerializer, VoterRecordSerializer, EventSerializer, EmergencyBroadcastSerializer

from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

from rest_framework.throttling import AnonRateThrottle

class LoginThrottle(AnonRateThrottle):
    scope = 'login'

def get_recursive_downline(member_id, depth_limit=10):
    """
    Returns a tuple of (all_member_ids, max_depth) for the given member's downline.
    """
    all_ids = set()
    max_d = 0
    stack = []
    
    # Get direct recruits first
    direct_recruits = Member.objects.filter(referred_by_id=member_id).values_list('id', flat=True)
    for rid in direct_recruits:
        stack.append((rid, 1))
        all_ids.add(rid)
        max_d = max(max_d, 1)

    while stack:
        mid, depth = stack.pop()
        if depth >= depth_limit:
            continue
            
        recruits = Member.objects.filter(referred_by_id=mid).values_list('id', flat=True)
        for rid in recruits:
            if rid not in all_ids:
                all_ids.add(rid)
                stack.append((rid, depth + 1))
                max_d = max(max_d, depth + 1)
                
    return list(all_ids), max_d

class MemberLoginView(views.APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]
    def post(self, request):
        first_name = request.data.get('firstName', '').strip()
        national_id = request.data.get('nationalId', '').strip()

        if not first_name or not national_id:
            return response.Response(
                {"error": "First name and National ID are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = Member.objects.filter(
            national_id=national_id,
            full_name__istartswith=first_name
        ).first()

        if not member:
            return response.Response(
                {"error": "No member found with that First Name and ID combination."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not member.is_active:
            return response.Response(
                {"error": "ACCESS DENIED: Your account has been permanently deactivated by HQ."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not member.is_voter_verified and not member.is_admin:
            return response.Response(
                {"error": "You must be a registered and verified voter to log in."},
                status=status.HTTP_403_FORBIDDEN
            )

        token, _ = Token.objects.get_or_create(user=member)
        return response.Response({
            "token": token.key,
            "member": MemberSerializer(member).data
        })

class MemberRegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data.copy()
        referrer_id = data.get('referred_by')
        invite_token = data.get('invite_token')
        
        # SECURITY FIX: Force is_admin to False for all public registrations
        data['is_admin'] = False
        data['is_staff'] = False
        data['is_superuser'] = False

        # 1. Quota Check
        if referrer_id and not invite_token:
            try:
                referrer = Member.objects.get(id=referrer_id)
                quota = 10 if referrer.referred_by is None else 5
                current_count = referrer.recruits.count()
                if current_count >= quota:
                    return response.Response(
                        {"error": f"Recruiter has reached their quota of {quota} members."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Member.DoesNotExist:
                return response.Response({"error": "Invalid referrer."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Duplicate Check
        if Member.objects.filter(Q(phone=data.get('phone')) | Q(national_id=data.get('national_id'))).exists():
            return response.Response(
                {"error": "Phone or ID already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Check Voter Register with enhanced matching FIRST
        national_id = data.get('national_id', '')
        phone = data.get('phone', '')
        full_name = data.get('full_name', '')
        matched_record = None

        # Direct match first
        direct = VoterRecord.objects.filter(
            Q(id_number=national_id) | Q(phone_number=phone)
        ).first()
        
        if direct:
            matched_record = direct

        if not matched_record and national_id:
            # Try masked ID matching (checking first and last digits)
            id_len = len(national_id)
            if id_len >= 5:
                id_pattern = f"{national_id[0]}{'*' * (id_len - 2)}{national_id[-1]}"
                name_parts = [p for p in full_name.upper().split(' ') if len(p) > 2]
                potential_matches = list(VoterRecord.objects.filter(id_number=id_pattern))

                # Pass 1: 2+ name parts
                for record in potential_matches:
                    record_name_upper = record.full_name.upper()
                    if sum(1 for part in name_parts if part in record_name_upper) >= 2:
                        matched_record = record
                        break

                # Pass 2: 1 name part fallback
                if not matched_record:
                    for record in potential_matches:
                        record_name_upper = record.full_name.upper()
                        if sum(1 for part in name_parts if part in record_name_upper) >= 1:
                            matched_record = record
                            break

        if not matched_record:
            return response.Response(
                {"error": "Re-check your information, you made an error."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Invite Token Check
        if invite_token:
            try:
                invite = Invite.objects.get(id=invite_token)
                if invite.is_used:
                    return response.Response({"error": "Invite already used."}, status=status.HTTP_400_BAD_REQUEST)
                invite.is_used = True
                invite.save()
            except (Invite.DoesNotExist, ValueError):
                return response.Response({"error": "Invalid invite code."}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Create Member
        serializer = MemberSerializer(data=data)
        if serializer.is_valid():
            member = serializer.save()
            
            member.is_voter_verified = True
            member.official_ward = matched_record.ward or ''
            member.official_polling_station = matched_record.polling_station or ''
            
            if matched_record.gender:
                member.gender = matched_record.gender
                
            member.save()

            # Update the voter record to unmask ID and phone number
            matched_record.id_number = member.national_id
            matched_record.phone_number = member.phone
            matched_record.save(update_fields=['id_number', 'phone_number'])

            token, _ = Token.objects.get_or_create(user=member)
            return response.Response({
                "token": token.key,
                "member": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        # If we failed to save, un-use the invite
        if invite_token:
            Invite.objects.filter(id=invite_token).update(is_used=False)
            
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MemberMeView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return response.Response(MemberSerializer(request.user).data)

class MemberPublicView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
            return response.Response({
                "id": member.id,
                "full_name": member.full_name
            })
        except Member.DoesNotExist:
            return response.Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

class MemberInsightsView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        if not request.user.is_admin and request.user.id != int(pk):
            return response.Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return response.Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

        # Lineage (Walking up)
        lineage = []
        curr = member
        while curr:
            lineage.insert(0, MemberSerializer(curr).data)
            curr = curr.referred_by
            if len(lineage) > 10: break # Safety break

        # Network Size & Depth (Recursive)
        network_ids, network_depth = get_recursive_downline(member.id)
        
        return response.Response({
            "member_id": member.id,
            "tier": len(lineage),
            "network_size": len(network_ids),
            "network_depth": network_depth,
            "direct_invites": member.recruits.count(),
            "lineage": lineage,
            "direct_inviter": lineage[-2] if len(lineage) > 1 else None,
            "top_mobilizer": lineage[0] if lineage else None
        })

class MemberListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Member.objects.all().order_by('-id')
    serializer_class = MemberSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        referred_by = self.request.query_params.get('referred_by')
        if referred_by:
            if referred_by == 'null':
                queryset = queryset.filter(referred_by__isnull=True)
            else:
                queryset = queryset.filter(referred_by=referred_by)

        # ALWAYS filter out admins and staff from the public member lists
        queryset = queryset.filter(is_admin=False, is_staff=False)

        if not self.request.user.is_admin:
            # Regular users can only see their direct recruits
            queryset = queryset.filter(referred_by=self.request.user)
        
        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            if search.isdigit():
                queryset = queryset.filter(Q(national_id__icontains=search))
            else:
                name_parts = [p for p in search.split(' ') if p]
                for part in name_parts:
                    queryset = queryset.filter(
                        Q(full_name__icontains=part) | Q(national_id__icontains=part)
                    )
        
        voter_status = self.request.query_params.get('voter_status')
        if voter_status == 'verified':
            queryset = queryset.filter(is_voter_verified=True)
        elif voter_status == 'unverified':
            queryset = queryset.filter(is_voter_verified=False)
            
        sort = self.request.query_params.get('sort')
        if sort == 'voter_status':
            queryset = queryset.order_by('-is_voter_verified', '-id')
        elif sort == 'voter_status_asc':
            queryset = queryset.order_by('is_voter_verified', '-id')
            
        return queryset
class MemberDetailView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
            return response.Response(MemberSerializer(member).data)
        except Member.DoesNotExist:
            return response.Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        """Only allows updating referred_by (for Promote to Root feature)."""
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return response.Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = {'referred_by'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if 'referred_by' in data:
            val = data['referred_by']
            if val is None or val == 'null' or val == '':
                member.referred_by = None
            else:
                try:
                    member.referred_by = Member.objects.get(pk=val)
                except Member.DoesNotExist:
                    return response.Response({"error": "Referrer not found"}, status=status.HTTP_400_BAD_REQUEST)

        member.save()
        return response.Response(MemberSerializer(member).data)

class VoterRecordPagination(PageNumberPagination):
    page_size = 50

class VoterRecordListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = VoterRecord.objects.all().order_by('full_name')
    serializer_class = VoterRecordSerializer
    pagination_class = VoterRecordPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            if search.isdigit():
                queryset = queryset.filter(
                    Q(id_number__icontains=search) | 
                    Q(phone_number__icontains=search)
                )
            else:
                name_parts = [p for p in search.split(' ') if p]
                for part in name_parts:
                    queryset = queryset.filter(
                        Q(full_name__icontains=part) | 
                        Q(id_number__icontains=part) | 
                        Q(phone_number__icontains=part) |
                        Q(ward__icontains=part)
                    )
        
        ward = self.request.query_params.get('ward')
        if ward:
            queryset = queryset.filter(ward__icontains=ward)
            
        return queryset

class ReportStatsView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        member_id = request.query_params.get('member_id')
        mode = request.query_params.get('mode', 'all')  # all | verified | unverified

        base_qs = Member.objects.filter(is_admin=False, is_staff=False)
        if member_id:
            downline_ids, _ = get_recursive_downline(member_id)
            # Include direct recruits AND their downline
            base_qs = base_qs.filter(id__in=downline_ids)
        elif not request.user.is_admin:
            downline_ids, _ = get_recursive_downline(request.user.id)
            base_qs = base_qs.filter(id__in=downline_ids)

        if mode == 'verified':
            queryset = base_qs.filter(is_voter_verified=True)
            ward_field = 'official_ward'
            station_field = 'official_polling_station'
        elif mode == 'unverified':
            queryset = base_qs.filter(is_voter_verified=False)
            ward_field = 'ward'
            station_field = 'polling_station'
        else:  # all
            queryset = base_qs
            ward_field = 'ward'
            station_field = 'polling_station'

        ward_summary = queryset.values(ward_field).annotate(count=Count('id')).order_by('-count')
        polling_summary = queryset.values(station_field, ward_field).annotate(count=Count('id')).order_by('-count')

        ward_res = [{"ward": item[ward_field] or "Unknown", "count": item['count']} for item in ward_summary]
        polling_res = [
            {
                "station": item[station_field] or "Unknown",
                "ward": item[ward_field] or "Unknown",
                "count": item['count']
            }
            for item in polling_summary
        ]

        return response.Response({
            "ward_summary": ward_res,
            "polling_summary": polling_res,
            "total": queryset.count(),
            "mode": mode,
        })

class SystemStatsView(views.APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        total = Member.objects.filter(is_admin=False, is_staff=False).count()
        roots = Member.objects.filter(referred_by__isnull=True, is_admin=False, is_staff=False).count()
        verified = Member.objects.filter(is_voter_verified=True, is_admin=False, is_staff=False).count()
        unverified = total - verified
        
        return response.Response({
            "total_registered": total,
            "total_roots": roots,
            "verified_voters": verified,
            "unverified_new": unverified,
        })

class InviteCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Invite.objects.all()
    serializer_class = InviteSerializer

class InviteDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    queryset = Invite.objects.all()
    serializer_class = InviteSerializer
    lookup_field = 'id'

class VoterLookupView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return response.Response([])

        # Handle numeric queries (ID/Phone) immediately
        if query.isdigit() and len(query) >= 3:
            queryset = VoterRecord.objects.filter(
                Q(id_number__icontains=query) | Q(phone_number__icontains=query)
            )[:15]
            return response.Response(VoterRecordSerializer(queryset, many=True).data)

        # Name-based search (match all name parts of length >= 2)
        name_parts = [p for p in query.upper().split(' ') if len(p) >= 2]
        if not name_parts:
            return response.Response([])
        
        queryset = VoterRecord.objects.all()
        for part in name_parts:
            queryset = queryset.filter(
                Q(full_name__icontains=part) | 
                Q(id_number__icontains=part) | 
                Q(phone_number__icontains=part)
            )
        
        queryset = queryset[:15]

        serializer = VoterRecordSerializer(queryset, many=True)
        return response.Response(serializer.data)


# ─── Polling Station Coverage ────────────────────────────────────────────────
class PollingCoverageView(views.APIView):
    """
    Returns DCP member count per ward and polling station,
    mapped against the known 142-station Ol Kalou register.
    Accessible to all authenticated members.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        base = Member.objects.filter(is_admin=False, is_staff=False)

        # Ward-level summary
        ward_summary = (
            base.values('ward')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Polling station breakdown (both self-reported and IEBC-verified)
        station_all = (
            base.values('polling_station', 'ward')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        station_verified = (
            base.filter(is_voter_verified=True)
            .values('official_polling_station', 'official_ward')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return response.Response({
            'total': base.count(),
            'verified': base.filter(is_voter_verified=True).count(),
            'ward_summary': [
                {'ward': r['ward'] or 'Unknown', 'count': r['count']}
                for r in ward_summary
            ],
            'station_all': [
                {
                    'station': r['polling_station'] or 'Unknown',
                    'ward': r['ward'] or 'Unknown',
                    'count': r['count'],
                }
                for r in station_all
            ],
            'station_verified': [
                {
                    'station': r['official_polling_station'] or 'Unknown',
                    'ward': r['official_ward'] or 'Unknown',
                    'count': r['count'],
                }
                for r in station_verified
            ],
        })


# ─── Recruiter Leaderboard ───────────────────────────────────────────────────
class LeaderboardView(views.APIView):
    """
    Returns top 20 mobilizers by direct recruits and ward-level totals.
    Accessible to all authenticated members.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Top mobilizers (direct invites, excluding admins/staff)
        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)

        top_members = (
            Member.objects
            .filter(is_admin=False, is_staff=False)
            .annotate(
                recruits_total=Count('recruits'),
                recent_recruits_count=Count('recruits', filter=Q(recruits__created_at__gte=seven_days_ago))
            )
            .order_by('-recruits_total')[:20]
        )

        # Ward totals for ward leaderboard
        ward_totals = (
            Member.objects
            .filter(is_admin=False, is_staff=False)
            .values('ward')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return response.Response({
            'top_mobilizers': [
                {
                    'rank': idx + 1,
                    'id': m.id,
                    'full_name': m.full_name,
                    'is_active': m.is_active,
                    'ward': m.ward or 'Unknown',
                    'polling_station': m.polling_station or 'Unknown',
                    'direct_recruits': m.recruits_total,
                    'is_root': m.referred_by_id is None,
                }
                for idx, m in enumerate(top_members)
            ],
            'ward_totals': [
                {'ward': r['ward'] or 'Unknown', 'count': r['count']}
                for r in ward_totals
            ],
        })


# ─── GOTV Election Day Strike-off ────────────────────────────────────────────
class GotvListView(views.APIView):
    """
    Admin-only: Returns DCP members at a given polling station
    for the election-day strike-off tool.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        station = request.query_params.get('station', '').strip()
        ward    = request.query_params.get('ward', '').strip()

        qs = Member.objects.filter(is_admin=False, is_staff=False)
        if station:
            qs = qs.filter(
                Q(polling_station__icontains=station) |
                Q(official_polling_station__icontains=station)
            )
        if ward:
            qs = qs.filter(
                Q(ward__icontains=ward) |
                Q(official_ward__icontains=ward)
            )

        return response.Response([
            {
                'id': m.id,
                'full_name': m.full_name,
                    'is_active': m.is_active,
                'ward': m.official_ward or m.ward or 'Unknown',
                'polling_station': m.official_polling_station or m.polling_station or 'Unknown',
                'has_voted': m.has_voted,
                'is_voter_verified': m.is_voter_verified,
            }
            for m in qs.order_by('full_name')
        ])


class GotvMarkVotedView(views.APIView):
    """
    Authenticated agents mark a DCP supporter as voted.
    PATCH /api/gotv/<pk>/voted
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            member = Member.objects.get(pk=pk, is_admin=False, is_staff=False)
        except Member.DoesNotExist:
            return response.Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        member.has_voted = not member.has_voted   # Toggle
        member.save(update_fields=['has_voted'])
        return response.Response({
            'id': member.id,
            'full_name': member.full_name,
            'has_voted': member.has_voted,
        })


import datetime

# ─── Panna Pramukh: Canvass Assignments ──────────────────────────────────────
class CanvassListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CanvassAssignment.objects.select_related('mobilizer').all()
        member_id = request.query_params.get('member')
        if member_id:
            qs = qs.filter(mobilizer_id=member_id)
        if not request.user.is_admin:
            qs = qs.filter(mobilizer=request.user)
        return response.Response([
            {
                'id': a.id,
                'mobilizer_id': a.mobilizer_id,
                'mobilizer_name': a.mobilizer.full_name,
                'ward': a.ward,
                'polling_station': a.polling_station or '',
                'target_households': a.target_households,
                'notes': a.notes,
                'is_completed': a.is_completed,
                'assigned_at': a.assigned_at,
            }
            for a in qs.order_by('-assigned_at')
        ])

    def post(self, request):
        d = request.data
        try:
            mob = Member.objects.get(pk=d['mobilizer_id'])
        except Member.DoesNotExist:
            return response.Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        a = CanvassAssignment.objects.create(
            mobilizer=mob,
            ward=d.get('ward', ''),
            polling_station=d.get('polling_station', ''),
            target_households=int(d.get('target_households', 50)),
            notes=d.get('notes', ''),
        )
        return response.Response({'id': a.id, 'message': 'Assignment created'}, status=status.HTTP_201_CREATED)


class CanvassDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            a = CanvassAssignment.objects.get(pk=pk)
        except CanvassAssignment.DoesNotExist:
            return response.Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        a.is_completed = not a.is_completed
        a.save(update_fields=['is_completed'])
        return response.Response({'id': a.id, 'is_completed': a.is_completed})

    def delete(self, request, pk):
        try:
            CanvassAssignment.objects.get(pk=pk).delete()
        except CanvassAssignment.DoesNotExist:
            pass
        return response.Response(status=status.HTTP_204_NO_CONTENT)


# ─── Boda-Boda Transport ─────────────────────────────────────────────────────
class TransportListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ward = request.query_params.get('ward', '')
        qs = TransportRequest.objects.select_related('member').all()
        if ward:
            qs = qs.filter(ward__icontains=ward)
        if not request.user.is_admin:
            qs = qs.filter(member=request.user)
        return response.Response([
            {
                'id': t.id,
                'member_id': t.member_id,
                'member_name': t.member.full_name,
                'phone': t.member.phone,
                'pickup_location': t.pickup_location,
                'ward': t.ward,
                'polling_station': t.polling_station,
                'rider_name': t.rider_name,
                'rider_phone': t.rider_phone,
                'status': t.status,
                'created_at': t.created_at,
            }
            for t in qs.order_by('ward', 'polling_station')
        ])

    def post(self, request):
        d = request.data
        member = request.user
        tr, created = TransportRequest.objects.get_or_create(
            member=member,
            defaults={
                'pickup_location': d.get('pickup_location', ''),
                'ward': d.get('ward', member.ward or ''),
                'polling_station': d.get('polling_station', member.polling_station or ''),
            }
        )
        return response.Response(
            {'id': tr.id, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class TransportUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            t = TransportRequest.objects.get(pk=pk)
        except TransportRequest.DoesNotExist:
            return response.Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        t.status = request.data.get('status', t.status)
        t.rider_name = request.data.get('rider_name', t.rider_name)
        t.rider_phone = request.data.get('rider_phone', t.rider_phone)
        t.save(update_fields=['status', 'rider_name', 'rider_phone'])
        return response.Response({'id': t.id, 'status': t.status, 'rider_name': t.rider_name, 'rider_phone': t.rider_phone})


# ─── Polling Agent Deployment ─────────────────────────────────────────────────
class AgentListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PollingAgent.objects.select_related('member').all()
        if not request.user.is_admin:
            qs = qs.filter(member=request.user)
        return response.Response([
            {
                'id': a.id,
                'member_id': a.member_id,
                'member_name': a.member.full_name,
                'phone': a.member.phone,
                'ward': a.ward,
                'polling_station': a.polling_station,
                'checked_in': a.checked_in,
                'check_in_time': a.check_in_time,
                'notes': a.notes,
            }
            for a in qs.order_by('ward', 'polling_station')
        ])

    def post(self, request):
        d = request.data
        try:
            member = Member.objects.get(pk=d['member_id'])
        except Member.DoesNotExist:
            return response.Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        agent, created = PollingAgent.objects.get_or_create(
            member=member,
            polling_station=d.get('polling_station', ''),
            defaults={
                'ward': d.get('ward', ''),
                'notes': d.get('notes', ''),
            }
        )
        return response.Response(
            {'id': agent.id, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class AgentCheckInView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            agent = PollingAgent.objects.get(pk=pk)
        except PollingAgent.DoesNotExist:
            return response.Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        agent.checked_in = not agent.checked_in
        agent.check_in_time = datetime.datetime.now() if agent.checked_in else None
        agent.save(update_fields=['checked_in', 'check_in_time'])
        return response.Response({
            'id': agent.id,
            'checked_in': agent.checked_in,
            'check_in_time': agent.check_in_time,
        })


# ─── PVT: Tally Records ───────────────────────────────────────────────────────
class TallyListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = TallyRecord.objects.select_related('submitted_by').all()
        ward = request.query_params.get('ward')
        if ward:
            qs = qs.filter(ward__icontains=ward)
            
        if not request.user.is_admin:
            qs = qs.filter(submitted_by=request.user)

        # Aggregate totals
        total_dcp = sum(t.dcp_votes for t in qs)
        total_uda = sum(t.uda_votes for t in qs)
        total_other = sum(t.other_votes for t in qs)
        total_cast = sum(t.total_votes_cast for t in qs)

        return response.Response({
            'summary': {
                'stations_reported': qs.count(),
                'dcp_total': total_dcp,
                'uda_total': total_uda,
                'other_total': total_other,
                'total_cast': total_cast,
                'dcp_pct': round((total_dcp / total_cast * 100), 1) if total_cast else 0,
            },
            'records': [
                {
                    'id': t.id,
                    'polling_station': t.polling_station,
                    'ward': t.ward,
                    'dcp_votes': t.dcp_votes,
                    'uda_votes': t.uda_votes,
                    'other_votes': t.other_votes,
                    'total_votes_cast': t.total_votes_cast,
                    'registered_voters': t.registered_voters,
                    'submitted_by': t.submitted_by.full_name if t.submitted_by else 'Unknown',
                    'is_verified': t.is_verified,
                    'form_34a_image': request.build_absolute_uri(t.form_34a_image.url) if t.form_34a_image else None,
                    'submitted_at': t.submitted_at,
                    'notes': t.notes,
                }
                for t in qs.order_by('ward', 'polling_station')
            ]
        })

    def post(self, request):
        d = request.data
        member = request.user
        tally, created = TallyRecord.objects.update_or_create(
            polling_station=d.get('polling_station', ''),
            submitted_by=member,
            defaults={
                'ward': d.get('ward', member.official_ward or member.ward or ''),
                'dcp_votes': int(d.get('dcp_votes', 0)),
                'uda_votes': int(d.get('uda_votes', 0)),
                'other_votes': int(d.get('other_votes', 0)),
                'total_votes_cast': int(d.get('total_votes_cast', 0)),
                'registered_voters': int(d.get('registered_voters', 0)),
                'notes': d.get('notes', ''),
            }
        )

        if 'form_34a_image' in request.FILES:
            tally.form_34a_image = request.FILES['form_34a_image']
            tally.save()
            
        return response.Response(
            {'id': tally.id, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# ─── SMS Export (ward/station filtered phone list) ────────────────────────────
class SmsExportView(views.APIView):
    """
    Returns phone numbers + names for bulk SMS filtered by ward/station.
    The caller uses this list to send via Africa's Talking, Safaricom Bulk SMS, etc.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ward = request.query_params.get('ward', '')
        station = request.query_params.get('station', '')
        qs = Member.objects.filter(is_admin=False, is_staff=False)
        if ward:
            qs = qs.filter(Q(ward__icontains=ward) | Q(official_ward__icontains=ward))
        if station:
            qs = qs.filter(
                Q(polling_station__icontains=station) |
                Q(official_polling_station__icontains=station)
            )
        recipients = [
            {
                'name': m.full_name,
                'phone': m.phone,
                'ward': m.official_ward or m.ward,
                'station': m.official_polling_station or m.polling_station,
            }
            for m in qs.order_by('ward', 'full_name')
            if m.phone
        ]
        return response.Response({
            'count': len(recipients),
            'recipients': recipients,
        })


# ─── Relational Contact Matcher ───────────────────────────────────────────────
class ContactMatcherView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 3:
            return response.Response([])
        
        # Search voter register for matching names
        voters = VoterRecord.objects.filter(full_name__icontains=query)[:20]
        
        # Check which of these are already DCP members
        results = []
        for v in voters:
            is_member = Member.objects.filter(national_id=v.id_number).exists() if v.id_number else False
            results.append({
                'id': v.id,
                'full_name': v.full_name,
                'id_number': v.id_number,
                'ward': v.ward,
                'polling_station': v.polling_station,
                'is_member': is_member
            })
        return response.Response(results)


# ─── Ushahidi-Style Incident Reporter ─────────────────────────────────────────
class IncidentListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = IncidentReport.objects.select_related('reporter').all().order_by('-reported_at')
        if not request.user.is_admin:
            qs = qs.filter(reporter=request.user)
        return response.Response([
            {
                'id': i.id,
                'reporter_name': i.reporter.full_name if i.reporter else 'Anonymous',
                'incident_type': i.incident_type,
                'ward': i.ward,
                'polling_station': i.polling_station,
                'description': i.description,
                'status': i.status,
                'reported_at': i.reported_at,
            }
            for i in qs
        ])

    def post(self, request):
        d = request.data
        incident = IncidentReport.objects.create(
            reporter=request.user,
            incident_type=d.get('incident_type', 'other'),
            ward=d.get('ward', request.user.ward or ''),
            polling_station=d.get('polling_station', request.user.polling_station or ''),
            description=d.get('description', ''),
        )
        return response.Response({'id': incident.id}, status=status.HTTP_201_CREATED)

class IncidentDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            incident = IncidentReport.objects.get(pk=pk)
        except IncidentReport.DoesNotExist:
            return response.Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        incident.status = request.data.get('status', incident.status)
        incident.save(update_fields=['status'])
        return response.Response({'id': incident.id, 'status': incident.status})


# ─── Virtual Phone Banking ────────────────────────────────────────────────────
class PhoneBankQueueView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Assign 1 pending target to this caller (or fetch one they already have pending)
        target = PhoneBankTarget.objects.filter(status='pending', assigned_to=request.user).first()
        if not target:
            # Grab a new unassigned one
            target = PhoneBankTarget.objects.filter(status='pending', assigned_to__isnull=True).first()
            if target:
                target.assigned_to = request.user
                target.save(update_fields=['assigned_to'])
        
        if not target:
            return response.Response({'target': None})
            
        return response.Response({
            'target': {
                'id': target.id,
                'voter_name': target.voter_name,
                'phone': target.phone,
                'ward': target.ward,
                'polling_station': target.polling_station,
            }
        })

class CallRecordCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        d = request.data
        try:
            target = PhoneBankTarget.objects.get(pk=d['target_id'])
        except PhoneBankTarget.DoesNotExist:
            return response.Response({'error': 'Target not found'}, status=status.HTTP_404_NOT_FOUND)
            
        outcome = d.get('outcome')
        CallRecord.objects.create(
            caller=request.user,
            target=target,
            outcome=outcome,
            notes=d.get('notes', '')
        )
        
        # Update target status
        if outcome == 'wrong_number':
            target.status = 'unreachable'
        else:
            target.status = 'called'
        target.save(update_fields=['status'])
        
        return response.Response({'success': True}, status=status.HTTP_201_CREATED)

# ─── Events & Rally Check-ins ────────────────────────────────────────────────
from .models import Event, EventAttendance
from .serializers import EventSerializer, EventAttendanceSerializer

class EventListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer

class EventDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminUser]
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventAttendanceView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, event_id):
        attendances = EventAttendance.objects.filter(event_id=event_id).select_related('member')
        serializer = EventAttendanceSerializer(attendances, many=True)
        return response.Response(serializer.data)

    def post(self, request, event_id):
        member_id = request.data.get('member_id')
        if not member_id:
            return response.Response({"error": "member_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            event = Event.objects.get(id=event_id)
            member = Member.objects.get(id=member_id)
        except (Event.DoesNotExist, Member.DoesNotExist):
            return response.Response({"error": "Event or Member not found"}, status=status.HTTP_404_NOT_FOUND)

        attendance, created = EventAttendance.objects.get_or_create(event=event, member=member)
        if not created:
            return response.Response({"error": "Already checked in"}, status=status.HTTP_400_BAD_REQUEST)

        EventAttendance.objects.create(event=event, member=request.user)
        return response.Response({"status": "Checked in"}, status=status.HTTP_201_CREATED)

class EmergencyBroadcastView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the active broadcast for this specific mobilizer."""
        broadcasts = EmergencyBroadcast.objects.filter(is_active=True).order_by('-created_at')
        
        applicable_broadcast = None
        for b in broadcasts:
            if b.target_type == 'global':
                applicable_broadcast = b
                break
            elif b.target_type == 'ward' and request.user.ward in (b.target_wards or []):
                if not b.target_polling_stations or request.user.polling_station in b.target_polling_stations:
                    applicable_broadcast = b
                    break
            elif b.target_type == 'specific_people' and b.target_members.filter(id=request.user.id).exists():
                applicable_broadcast = b
                break
                
        if applicable_broadcast:
            return response.Response(EmergencyBroadcastSerializer(applicable_broadcast).data)
        return response.Response({"status": "No active broadcasts"}, status=status.HTTP_204_NO_CONTENT)

    def post(self, request):
        """Admin creates a new targeted broadcast."""
        if not request.user.is_admin:
            return response.Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        message = request.data.get('message')
        severity = request.data.get('severity', 'critical')
        target_type = request.data.get('target_type', 'global')
        target_wards = request.data.get('target_wards', [])
        target_polling_stations = request.data.get('target_polling_stations', [])
        target_member_ids = request.data.get('target_member_ids', [])
        
        if not message:
            return response.Response({"error": "Message required"}, status=status.HTTP_400_BAD_REQUEST)
            
        EmergencyBroadcast.objects.filter(is_active=True).update(is_active=False)
        
        broadcast = EmergencyBroadcast.objects.create(
            message=message,
            severity=severity,
            target_type=target_type,
            target_wards=target_wards,
            target_polling_stations=target_polling_stations,
            created_by=request.user,
            is_active=True
        )
        
        if target_type == 'specific_people' and target_member_ids:
            members = Member.objects.filter(id__in=target_member_ids)
            broadcast.target_members.set(members)
            
        return response.Response(EmergencyBroadcastSerializer(broadcast).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Admin clears the active broadcast."""
        if not request.user.is_admin:
            return response.Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        EmergencyBroadcast.objects.filter(is_active=True).update(is_active=False)
        return response.Response({"status": "Broadcast cleared"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_wards_and_stations(request):
    """Returns a dictionary mapping Wards to their unique Polling Stations."""
    wards_data = VoterRecord.objects.values('ward', 'polling_station').distinct()
    
    mapping = {}
    for entry in wards_data:
        ward = entry.get('ward')
        station = entry.get('polling_station')
        if not ward:
            continue
            
        if ward not in mapping:
            mapping[ward] = []
            
        if station and station not in mapping[ward]:
            mapping[ward].append(station)
            
    sorted_mapping = {w: sorted(s) for w, s in sorted(mapping.items())}
    return response.Response(sorted_mapping)


class MemberToggleActiveView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return response.Response({"error": "Only admins can deactivate members."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            member = Member.objects.get(pk=pk)
            # Prevent admin from deactivating themselves
            if member.id == request.user.id:
                return response.Response({"error": "You cannot deactivate yourself."}, status=status.HTTP_400_BAD_REQUEST)
                
            member.is_active = not member.is_active
            member.save()
            return response.Response({"message": "Status updated.", "is_active": member.is_active})
        except Member.DoesNotExist:
            return response.Response({"error": "Member not found."}, status=status.HTTP_404_NOT_FOUND)


class WardHealthInsightsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        forty_eight_hours_ago = now - timedelta(hours=48)
        ninety_six_hours_ago = now - timedelta(hours=96)

        # Count recruits in current 48h
        current_period = Member.objects.filter(
            is_admin=False, is_staff=False,
            created_at__gte=forty_eight_hours_ago
        ).values('ward').annotate(count=Count('id'))
        
        current_dict = {item['ward']: item['count'] for item in current_period if item['ward']}

        # Count recruits in previous 48h
        previous_period = Member.objects.filter(
            is_admin=False, is_staff=False,
            created_at__gte=ninety_six_hours_ago,
            created_at__lt=forty_eight_hours_ago
        ).values('ward').annotate(count=Count('id'))

        previous_dict = {item['ward']: item['count'] for item in previous_period if item['ward']}

        insights = []
        for ward, current_count in current_dict.items():
            prev_count = previous_dict.get(ward, 0)
            
            # We only care if previous count was meaningful enough to form a trend
            if prev_count >= 5:
                drop_ratio = (prev_count - current_count) / prev_count
                
                # If velocity dropped by more than 20%
                if drop_ratio > 0.20:
                    percent_drop = int(drop_ratio * 100)
                    insights.append({
                        "ward": ward,
                        "type": "warning",
                        "message": f"Warning: {ward} mobilization velocity has slowed down by {percent_drop}% in the last 48 hours. Current 48h: {current_count} recruits (down from {prev_count}). Recommend deploying additional root mobilizers."
                    })
                elif drop_ratio < -0.20:
                    # Growth
                    percent_growth = int(abs(drop_ratio) * 100)
                    insights.append({
                        "ward": ward,
                        "type": "success",
                        "message": f"Positive Trend: {ward} mobilization is accelerating! Up {percent_growth}% in the last 48 hours ({current_count} recruits vs {prev_count})."
                    })

        # Sort insights (warnings first)
        insights.sort(key=lambda x: 0 if x['type'] == 'warning' else 1)

        return response.Response({"insights": insights})


class FraudDetectionView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        forty_eight_hours_ago = now - timedelta(hours=48)
        
        recent_recruits = Member.objects.filter(
            created_at__gte=forty_eight_hours_ago,
            referred_by__isnull=False
        ).select_related('referred_by').order_by('referred_by', 'created_at')

        alerts = []
        last_member = None
        
        for member in recent_recruits:
            if last_member and last_member.referred_by_id == member.referred_by_id:
                time_diff = (member.created_at - last_member.created_at).total_seconds()
                
                # Check 1: Speed anomaly (less than 30 seconds apart)
                if time_diff < 30:
                    alerts.append({
                        "type": "speed_anomaly",
                        "severity": "high",
                        "mobilizer_name": member.referred_by.full_name,
                        "mobilizer_id": member.referred_by_id,
                        "message": f"Registered {member.full_name} and {last_member.full_name} only {int(time_diff)} seconds apart.",
                        "timestamp": member.created_at
                    })
                
                # Check 2: Sequential ID anomaly (e.g. 1234567, 1234568)
                try:
                    if abs(int(member.national_id) - int(last_member.national_id)) == 1:
                        alerts.append({
                            "type": "sequential_id",
                            "severity": "critical",
                            "mobilizer_name": member.referred_by.full_name,
                            "mobilizer_id": member.referred_by_id,
                            "message": f"Registered sequential IDs: {last_member.national_id} and {member.national_id}.",
                            "timestamp": member.created_at
                        })
                except ValueError:
                    pass

            last_member = member

        return response.Response({"alerts": alerts})


class SaturationPredictionView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Total registered from official IEBC data
        official_totals = VoterRecord.objects.values('polling_station').annotate(total_voters=Count('id'))
        official_dict = {item['polling_station']: item['total_voters'] for item in official_totals if item['polling_station']}

        # Our recruits
        recruit_totals = Member.objects.values('polling_station').annotate(total_recruits=Count('id'))
        
        stations = []
        for r in recruit_totals:
            ps = r['polling_station']
            if not ps: continue
            
            recruits = r['total_recruits']
            total = official_dict.get(ps, 0)
            
            if total > 0:
                saturation = (recruits / total) * 100
                stations.append({
                    "polling_station": ps,
                    "recruits": recruits,
                    "total_registered": total,
                    "saturation_percent": round(saturation, 1)
                })

        stations.sort(key=lambda x: x['saturation_percent'], reverse=True)
        
        secured = [s for s in stations if s['saturation_percent'] >= 50][:5]
        at_risk = [s for s in stations[::-1] if s['saturation_percent'] < 50][:5]

        return response.Response({
            "secured": secured,
            "at_risk": at_risk
        })


class TargetMatchingView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return response.Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if not member.full_name or not member.polling_station:
            return response.Response({"targets": []})

        # Get last name
        name_parts = member.full_name.strip().split()
        if not name_parts:
            return response.Response({"targets": []})
        
        last_name = name_parts[-1]
        if len(last_name) < 3: # Ignore tiny names to prevent massive false positives
            return response.Response({"targets": []})

        # Get existing member IDs in this station to exclude
        existing_member_ids = Member.objects.filter(polling_station=member.polling_station).values_list('national_id', flat=True)

        # Search VoterRecord
        targets = VoterRecord.objects.filter(
            full_name__icontains=last_name,
            polling_station=member.polling_station
        ).exclude(id_number__in=existing_member_ids)[:10]

        target_data = [{"full_name": t.full_name, "id_number": t.id_number} for t in targets]

        return response.Response({"targets": target_data})


class DemographicInsightsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        import datetime
        from django.db.models import Count, Q
        
        current_year = datetime.datetime.now().year
        
        base_qs = Member.objects.filter(is_admin=False, is_staff=False)
        total = base_qs.count()
        if total == 0:
            return response.Response({
                "gender": {"male": 0, "female": 0, "unknown": 0},
                "age_buckets": {"youth": 0, "adult": 0, "elder": 0, "unknown": 0},
                "insights": ["No demographic data available yet."]
            })

        # Gender breakdown
        male_count = base_qs.filter(gender__iexact='M').count()
        female_count = base_qs.filter(gender__iexact='F').count()
        unknown_gender = total - (male_count + female_count)

        # Age breakdown
        # Youths: 18-35 (current_year - 35 <= yob <= current_year - 18)
        # Adults: 36-50
        # Elders: 50+
        youths = base_qs.filter(yob__gte=current_year - 35).count()
        adults = base_qs.filter(yob__lt=current_year - 35, yob__gte=current_year - 50).count()
        elders = base_qs.filter(yob__lt=current_year - 50).count()
        unknown_age = total - (youths + adults + elders)

        # AI Insights Generation
        insights = []
        
        # Gender insights
        if female_count > 0 and (female_count / total) < 0.3:
            insights.append("Warning: Women make up less than 30% of your recruits. Consider deploying more female mobilizers.")
        elif female_count > 0 and (female_count / total) > 0.5:
            insights.append("Success: Strong female turnout! Women make up the majority of your enrolled members.")
            
        # Age insights
        if youths > 0 and (youths / total) < 0.2:
            insights.append("Warning: Low youth enrollment. Youths (18-35) make up less than 20% of your base. Target younger demographics.")
        elif youths > 0 and (youths / total) > 0.6:
            insights.append("Insight: Excellent youth mobilization! Over 60% of your base is under 35.")
            
        if not insights:
            insights.append("Insight: Your demographic distribution is currently balanced.")

        # Optional: Station/Ward specific anomaly (Mock AI generation based on top ward)
        top_ward = base_qs.values('ward').annotate(c=Count('id')).order_by('-c').first()
        if top_ward and top_ward['ward']:
            w_name = top_ward['ward']
            w_youths = base_qs.filter(ward=w_name, yob__gte=current_year - 35).count()
            if w_youths > 0 and top_ward['c'] > 0:
                y_pct = (w_youths / top_ward['c']) * 100
                insights.append(f"AI Alert: {y_pct:.0f}% of your recruits in {w_name} Ward are Youths.")

        return response.Response({
            "gender": {
                "male": male_count,
                "female": female_count,
                "unknown": unknown_gender
            },
            "age_buckets": {
                "youth": youths,
                "adult": adults,
                "elder": elders,
                "unknown": unknown_age
            },
            "insights": insights
        })

