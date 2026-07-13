from rest_framework import serializers
from .models import Member, Invite, VoterRecord, Event, EventAttendance, EmergencyBroadcast

class MemberSerializer(serializers.ModelSerializer):
    referral_code = serializers.ReadOnlyField()
    recruits_count = serializers.SerializerMethodField()
    referrer_name = serializers.CharField(source='referred_by.full_name', read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'phone', 'national_id', 'email', 'yob',
            'ward', 'polling_station',
            'official_ward', 'official_polling_station',
            'referral_code', 'referred_by', 'is_voter_verified', 'created_at',
            'recruits_count', 'referrer_name', 'is_admin', 'is_staff', 'is_security', 'security_rank', 'is_security_only',
            'supporter_score', 'top_issue'
        ]

    def get_recruits_count(self, obj):
        return obj.recruits.count()

class InviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invite
        fields = ['id', 'target_role', 'is_used', 'created_at']

class VoterRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoterRecord
        fields = ['id', 'id_number', 'phone_number', 'full_name', 'ward', 'polling_station', 'dob', 'gender', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    attendees_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'location', 'description', 'created_at', 'attendees_count']

    def get_attendees_count(self, obj):
        return obj.attendees.count()

class EventAttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_ward = serializers.CharField(source='member.ward', read_only=True)

    class Meta:
        model = EventAttendance
        fields = ['id', 'event', 'member', 'checked_in_at', 'member_name', 'member_phone', 'member_ward']

class EmergencyBroadcastSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = EmergencyBroadcast
        fields = ['id', 'message', 'severity', 'target_type', 'target_wards', 'target_polling_stations', 'target_members', 'is_active', 'created_at', 'created_by', 'created_by_name']
        read_only_fields = ['created_by']
