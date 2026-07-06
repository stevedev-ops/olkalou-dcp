import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.serializers import deserialize
from django.db import transaction
from api.models import VoterRecord

def load_fast():
    print("Reading datadump.json...")
    with open('datadump.json', 'r') as f:
        json_data = f.read()

    voter_records = []
    other_objects = []

    print("Parsing objects...")
    for obj in deserialize("json", json_data):
        if obj.object.__class__.__name__ == 'VoterRecord':
            voter_records.append(obj.object)
        else:
            other_objects.append(obj)
            
    print(f"Found {len(other_objects)} configuration objects and {len(voter_records)} Voter Records.")
    
    with transaction.atomic():
        print("Saving configuration and member objects...")
        for obj in other_objects:
            obj.save()
            
        print("Saving 72,000+ Voter Records in bulk (this should only take a few seconds!)...")
        VoterRecord.objects.all().delete() # Clear any existing to prevent duplicates
        VoterRecord.objects.bulk_create(voter_records, batch_size=5000)
        
    print("✅ All data loaded successfully in record time!")

if __name__ == '__main__':
    load_fast()
