from django.urls import path
from . import views

urlpatterns = [
    path('login', views.MemberLoginView.as_view(), name='login'),
    path('register', views.MemberRegisterView.as_view(), name='register'),
    path('members/me', views.MemberMeView.as_view(), name='member-me'),
    path('members/<int:pk>/public', views.MemberPublicView.as_view(), name='member-public'),
    path('members/<int:pk>/insights', views.MemberInsightsView.as_view(), name='insights'),

    path('members', views.MemberListView.as_view(), name='member-list'),
    path('members/<int:pk>', views.MemberDetailView.as_view(), name='member-detail'),
    path('stats', views.SystemStatsView.as_view(), name='stats'),
    path('stats/reports', views.ReportStatsView.as_view(), name='report-stats'),
    path('invites', views.InviteCreateView.as_view(), name='invite-create'),
    path('invites/<uuid:id>', views.InviteDetailView.as_view(), name='invite-detail'),
    path('voter-records', views.VoterRecordListView.as_view(), name='voter-records'),
    path('voter-lookup', views.VoterLookupView.as_view(), name='voter-lookup'),
    path('polling-coverage', views.PollingCoverageView.as_view(), name='polling-coverage'),
    path('leaderboard', views.LeaderboardView.as_view(), name='leaderboard'),
    path('gotv', views.GotvListView.as_view(), name='gotv-list'),
    path('gotv/<int:pk>/voted', views.GotvMarkVotedView.as_view(), name='gotv-mark-voted'),
    # Panna Pramukh
    path('canvass', views.CanvassListView.as_view(), name='canvass-list'),
    path('canvass/<int:pk>', views.CanvassDetailView.as_view(), name='canvass-detail'),
    # Boda-boda Transport
    path('transport', views.TransportListView.as_view(), name='transport-list'),
    path('transport/<int:pk>', views.TransportUpdateView.as_view(), name='transport-update'),
    # Polling Agents
    path('agents', views.AgentListView.as_view(), name='agent-list'),
    path('agents/<int:pk>/checkin', views.AgentCheckInView.as_view(), name='agent-checkin'),
    # PVT Tallies
    path('tally', views.TallyListView.as_view(), name='tally-list'),
    # SMS Export
    path('sms-export', views.SmsExportView.as_view(), name='sms-export'),
    # Relational Contact Matcher
    path('contact-matcher', views.ContactMatcherView.as_view(), name='contact-matcher'),
    # Ushahidi-Style Incidents
    path('incidents', views.IncidentListView.as_view(), name='incident-list'),
    path('incidents/<int:pk>', views.IncidentDetailView.as_view(), name='incident-detail'),
    # Virtual Phone Banking
    path('phone-bank/queue', views.PhoneBankQueueView.as_view(), name='phonebank-queue'),
    path('phone-bank/call', views.CallRecordCreateView.as_view(), name='phonebank-call'),
    # Events & Rally Check-ins
    path('events', views.EventListView.as_view(), name='event-list'),
    path('events/<int:pk>', views.EventDetailView.as_view(), name='event-detail'),
    path('events/<int:event_id>/attendance', views.EventAttendanceView.as_view(), name='event-attendance'),
    # Emergency Broadcast
    path('broadcasts', views.EmergencyBroadcastView.as_view(), name='emergency-broadcasts'),
]
