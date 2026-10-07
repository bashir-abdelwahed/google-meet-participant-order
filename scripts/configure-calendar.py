"""Configure the public OAuth client ID (never a client secret) for this build."""
import argparse
import json
import re
from pathlib import Path
parser = argparse.ArgumentParser()
parser.add_argument('client_id', help='Google OAuth Chrome Extension client ID')
args = parser.parse_args()
if not re.fullmatch(r'[A-Za-z0-9-]+\.apps\.googleusercontent\.com', args.client_id):
    parser.error('Expected a Google OAuth client ID ending in .apps.googleusercontent.com')
path = Path(__file__).resolve().parent.parent / 'manifest.json'
manifest = json.loads(path.read_text())
manifest['oauth2'] = {'client_id': args.client_id, 'scopes': ['https://www.googleapis.com/auth/calendar.events.readonly']}
path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Configured Calendar OAuth. Reload the extension in Chrome. The client must match its extension ID.')
