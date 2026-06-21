from api.models import Member

# Create Admin
admin, created = Member.objects.get_or_create(
    national_id='11111111',
    defaults={
        'full_name': 'HQ Administrator',
        'phone': '0700000000',
        'is_admin': True,
        'is_staff': True,
        'is_superuser': True,
        'ward': 'Ol Kalou Central'
    }
)
admin.set_password('admin123')
admin.save()

# Create Regular Field User
user, created = Member.objects.get_or_create(
    national_id='22222222',
    defaults={
        'full_name': 'Field Agent Kamau',
        'phone': '0722222222',
        'is_admin': False,
        'ward': 'Kanjuiri Range',
        'polling_station': 'Passenga Primary'
    }
)
user.set_password('agent123')
user.save()

print("TEST ACCOUNTS CREATED SUCCESSFULLY")
