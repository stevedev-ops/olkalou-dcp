import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Member, VoterRecord
from django.db.models import Count, Q
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

for m in top_members[:1]:
    print(m.full_name, m.recruits_total, m.recent_recruits_count)
