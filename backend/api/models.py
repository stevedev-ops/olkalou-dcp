import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class MemberManager(BaseUserManager):
    def create_user(self, national_id, full_name, phone, password=None, **extra_fields):
        if not national_id:
            raise ValueError('The National ID must be set')
        user = self.model(national_id=national_id, full_name=full_name, phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, national_id, full_name, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        return self.create_user(national_id, full_name, phone, password, **extra_fields)

class Member(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True)
    national_id = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    yob = models.IntegerField(null=True, blank=True)
    ward = models.CharField(max_length=255, blank=True, null=True)
    polling_station = models.CharField(max_length=255, blank=True, null=True)
    # Official IEBC names — auto-populated from voter register on match
    official_ward = models.CharField(max_length=255, blank=True, null=True)
    official_polling_station = models.CharField(max_length=255, blank=True, null=True)
    referred_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='recruits'
    )
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_voter_verified = models.BooleanField(default=False)
    has_voted = models.BooleanField(default=False)  # Election-day GOTV strike-off
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MemberManager()

    USERNAME_FIELD = 'national_id'
    REQUIRED_FIELDS = ['full_name', 'phone']

    @property
    def referral_code(self):
        return str(self.id)

    def __str__(self):
        return self.full_name

class VoterRecord(models.Model):
    id_number = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    full_name = models.CharField(max_length=255, db_index=True)
    ward = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    polling_station = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.id_number or self.phone_number})"

class Invite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_role = models.CharField(max_length=50, default='root')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invite {self.id} ({self.target_role})"


# ─── Panna Pramukh: Canvass Area Assignments ──────────────────────────────────
class CanvassAssignment(models.Model):
    """Assigns a mobilizer (member) to a specific ward/polling station to canvass."""
    mobilizer = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name='canvass_assignments'
    )
    ward = models.CharField(max_length=255)
    polling_station = models.CharField(max_length=255, blank=True, null=True)
    target_households = models.IntegerField(default=50)
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mobilizer.full_name} → {self.polling_station or self.ward}"


# ─── Boda-Boda Transport Requests ────────────────────────────────────────────
class TransportRequest(models.Model):
    """A DCP supporter who needs a ride to the polling station on election day."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
    ]
    member = models.OneToOneField(
        Member, on_delete=models.CASCADE, related_name='transport_request'
    )
    pickup_location = models.CharField(max_length=255)
    ward = models.CharField(max_length=255, blank=True)
    polling_station = models.CharField(max_length=255, blank=True)
    rider_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ride: {self.member.full_name} from {self.pickup_location}"


# ─── Polling Agent Deployment ─────────────────────────────────────────────────
class PollingAgent(models.Model):
    """Maps a DCP member as a polling agent to a specific station."""
    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name='agent_assignments'
    )
    ward = models.CharField(max_length=255)
    polling_station = models.CharField(max_length=255)
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('member', 'polling_station')

    def __str__(self):
        return f"Agent {self.member.full_name} @ {self.polling_station}"


# ─── PVT: Parallel Vote Tabulation ───────────────────────────────────────────
class TallyRecord(models.Model):
    """Vote tally submitted by a field agent from their polling station (Form 34A)."""
    submitted_by = models.ForeignKey(
        Member, on_delete=models.SET_NULL, null=True, related_name='tallies'
    )
    polling_station = models.CharField(max_length=255)
    ward = models.CharField(max_length=255, blank=True)
    dcp_votes = models.IntegerField(default=0)
    uda_votes = models.IntegerField(default=0)
    other_votes = models.IntegerField(default=0)
    total_votes_cast = models.IntegerField(default=0)
    registered_voters = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('polling_station', 'submitted_by')

    def __str__(self):
        return f"Tally: {self.polling_station} — DCP {self.dcp_votes}"


# ─── Ushahidi-Style Incident Reporter ─────────────────────────────────────────
class IncidentReport(models.Model):
    """Tracks election day irregularities, bribery, or KIEMS kit failures."""
    INCIDENT_TYPES = [
        ('kiems_failure', 'KIEMS Kit Failure'),
        ('bribery', 'Voter Bribery'),
        ('violence', 'Intimidation / Violence'),
        ('late_opening', 'Late Opening of Station'),
        ('other', 'Other Irregularity'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
    ]
    reporter = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='incidents')
    incident_type = models.CharField(max_length=50, choices=INCIDENT_TYPES)
    ward = models.CharField(max_length=255)
    polling_station = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reported_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_incident_type_display()} at {self.polling_station}"


# ─── Virtual Phone Banking ────────────────────────────────────────────────────
class PhoneBankTarget(models.Model):
    """A voter designated to be called by the remote volunteer phone bank team."""
    STATUS_CHOICES = [
        ('pending', 'Pending Call'),
        ('called', 'Called'),
        ('unreachable', 'Unreachable'),
    ]
    voter_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    ward = models.CharField(max_length=255, blank=True)
    polling_station = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='phone_bank_assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Target: {self.voter_name} ({self.phone})"

class CallRecord(models.Model):
    """Logs the outcome of a phone bank call."""
    OUTCOME_CHOICES = [
        ('strong_dcp', 'Strong DCP'),
        ('leaning_dcp', 'Leaning DCP'),
        ('undecided', 'Undecided'),
        ('uda', 'Voting UDA'),
        ('not_voting', 'Not Voting'),
        ('wrong_number', 'Wrong Number / Unreachable'),
    ]
    caller = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='calls_made')
    target = models.ForeignKey(PhoneBankTarget, on_delete=models.CASCADE, related_name='call_records')
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    notes = models.TextField(blank=True)
    called_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Call to {self.target.voter_name} - {self.get_outcome_display()}"
