import os
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.venues.models import Cinema

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial data using venues_fixture.json and create default superuser.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--if-empty',
            action='store_true',
            help='Insert seed data only when core venue/movie tables are empty (Default).',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force load data even if database is not empty.',
        )

    def handle(self, *args, **options):
        # 1. Create a default superuser if none exists
        if not User.objects.filter(is_superuser=True).exists():
            self.stdout.write('Creating default superuser...')
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Superuser created: admin / admin123'))
        else:
            self.stdout.write('Superuser already exists.')

        # 2. Check if data already exists to avoid duplicates (unless --force is used)
        if Cinema.objects.exists() and not options['force']:
            self.stdout.write(self.style.WARNING('Data already exists in database. Use --force to reload.'))
            return

        # 3. Load the fixture
        # Django looks for fixtures in app/fixtures/ but we can provide a relative path
        fixture_path = 'venues_fixture.json'
        
        if os.path.exists(fixture_path):
            self.stdout.write(f'Loading data from {fixture_path}...')
            try:
                # We use loaddata management command internally
                call_command('loaddata', fixture_path)
                self.stdout.write(self.style.SUCCESS(f'Successfully loaded data from {fixture_path}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error loading fixture: {e}'))
        else:
            self.stdout.write(self.style.WARNING(f'Fixture {fixture_path} not found in root directory. Skipping data load.'))
            self.stdout.write('Make sure venues_fixture.json is in the backend/ directory.')
