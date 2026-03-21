import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

class Cinema(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    address = models.CharField(_('address'), max_length=500)
    city = models.CharField(_('city'), max_length=100)
    phone = models.CharField(_('phone'), max_length=20, blank=True)
    email = models.EmailField(_('email'), blank=True)
    photo = models.ImageField(
        _('photo'),
        upload_to='cinemas/',
        blank=True,
        null=True
    )
    is_active = models.BooleanField(_('active'), default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('cinema')
        verbose_name_plural = _('cinemas')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Room(models.Model):
    """Screening rooms/halls within a cinema."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cinema = models.ForeignKey(
        Cinema,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    capacity = models.PositiveIntegerField(
        _('capacity'),
        validators=[MinValueValidator(1)]
    )
    rows = models.PositiveIntegerField(_('number of rows'), default=10)
    seats_per_row = models.PositiveIntegerField(_('seats per row'), default=15)
    photo = models.ImageField(
        _('photo'),
        upload_to='rooms/',
        blank=True,
        null=True
    )
    is_active = models.BooleanField(_('active'), default=True)

    class RoomType(models.TextChoices):
        SIMPLE = 'SIMPLE', _('Simple')
        THREE_D = '3D', _('3D Capable')
        IMAX = 'IMAX', _('IMAX')
        DOLBY_ATMOS = 'DOLBY_ATMOS', _('Dolby Atmos')

    room_type = models.CharField(
        _('room type'),
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.SIMPLE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('room')
        verbose_name_plural = _('rooms')
        ordering = ['cinema', 'name']
        unique_together = ['cinema', 'name']
    
    def __str__(self):
        return f'{self.cinema.name} - {self.name}'


class Movie(models.Model):
    class Rating(models.TextChoices):
        G = 'G', _('General Audiences')
        PG = 'PG', _('Parental Guidance')
        PG13 = 'PG-13', _('Parents Strongly Cautioned')
        R = 'R', _('Restricted')
        NC17 = 'NC-17', _('Adults Only')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(_('title'), max_length=300)
    original_title = models.CharField(_('original title'), max_length=300, blank=True)
    description = models.TextField(_('description'))
    duration_minutes = models.PositiveIntegerField(_('duration (minutes)'))
    genre = models.CharField(_('genre'), max_length=100)
    director = models.CharField(_('director'), max_length=200, blank=True)
    cast = models.TextField(_('cast'), blank=True)
    rating = models.CharField(
        _('rating'),
        max_length=10,
        choices=Rating.choices,
        default=Rating.PG13
    )
    poster = models.ImageField(
        _('poster'),
        upload_to='movies/posters/',
        blank=True,
        null=True
    )
    trailer_url = models.URLField(_('trailer URL'), blank=True)
    release_date = models.DateField(_('release date'), null=True, blank=True)
    is_active = models.BooleanField(_('currently showing'), default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('movie')
        verbose_name_plural = _('movies')
        ordering = ['-release_date', 'title']
    
    def __str__(self):
        return self.title


class Showtime(models.Model):
    """Links movies to rooms at specific times with pricing."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name='showtimes'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='showtimes'
    )
    start_time = models.DateTimeField(_('start time'))
    end_time = models.DateTimeField(_('end time'))

    price = models.DecimalField(
        _('price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    is_active = models.BooleanField(_('active'), default=True)
    available_seats = models.PositiveIntegerField(_('available seats'))

    is_3d = models.BooleanField(_('3D showing'), default=False)
    is_imax = models.BooleanField(_('IMAX showing'), default=False)
    is_dolby_atmos = models.BooleanField(_('Dolby Atmos showing'), default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('showtime')
        verbose_name_plural = _('showtimes')
        ordering = ['start_time']
    
    def __str__(self):
        return f'{self.movie.title} - {self.room} - {self.start_time}'
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Ensure end_time is calculated if missing
        if self.movie and self.start_time and not self.end_time:
            from datetime import timedelta
            self.end_time = self.start_time + timedelta(minutes=self.movie.duration_minutes + 15)
            
        if self.start_time and self.end_time and self.room:
            if self.start_time >= self.end_time:
                raise ValidationError(_('Start time must be before end time.'))
                
            overlapping_showtimes = Showtime.objects.filter(
                room=self.room,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            )
            
            if self.pk:
                overlapping_showtimes = overlapping_showtimes.exclude(pk=self.pk)
                
            if overlapping_showtimes.exists():
                raise ValidationError(_('This room is already occupied by another showtime during this period.'))

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        # We call clean() manually since Django doesn't do it on save()
        self.clean()

        if self.available_seats is None and self.room:
            self.available_seats = self.room.capacity
            
        # Automatically inherit 3D and IMAX settings from the selected Room
        if self.room:
            self.is_3d = (self.room.room_type == Room.RoomType.THREE_D)
            self.is_imax = (self.room.room_type == Room.RoomType.IMAX)
            self.is_dolby_atmos = (self.room.room_type == Room.RoomType.DOLBY_ATMOS)
        
        super().save(*args, **kwargs)

        if is_new:
            ShowtimeSeat.generate_for_showtime(self)
    
    @property
    def is_sold_out(self):
        return self.available_seats <= 0

    @property
    def occupancy_percentage(self):
        if self.room.capacity == 0:
            return 0
        return ((self.room.capacity - self.available_seats) / self.room.capacity) * 100


class ShowtimeSeat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    showtime = models.ForeignKey(
        Showtime,
        on_delete=models.CASCADE,
        related_name='seats'
    )
    seat_number = models.CharField(_('seat number'), max_length=20)
    row_label = models.CharField(_('row label'), max_length=10)
    row_index = models.PositiveIntegerField(_('row index'))
    seat_index = models.PositiveIntegerField(_('seat index'))

    is_reserved = models.BooleanField(_('is reserved'), default=False)
    reserved_at = models.DateTimeField(_('reserved at'), null=True, blank=True)
    reservation = models.ForeignKey(
        'reservations.Reservation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reserved_seats'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('showtime seat')
        verbose_name_plural = _('showtime seats')
        ordering = ['row_index', 'seat_index']
        constraints = [
            models.UniqueConstraint(
                fields=['showtime', 'seat_number'],
                name='uniq_showtime_seat_number'
            )
        ]

    def __str__(self):
        return f'{self.showtime} - {self.seat_number}'

    @staticmethod
    def _row_label(row_index):
        if row_index < 26:
            return chr(ord('A') + row_index)
        return f'R{row_index + 1}'

    @classmethod
    def generate_for_showtime(cls, showtime):
        if showtime.seats.exists():
            return
        room = showtime.room
        if not room:
            return

        total_capacity = room.capacity
        rows = room.rows
        seats_per_row = room.seats_per_row

        seats = []
        created = 0
        for row_index in range(rows):
            row_label = cls._row_label(row_index)
            for seat_index in range(1, seats_per_row + 1):
                if created >= total_capacity:
                    break
                seat_number = f'{row_label}{seat_index}'
                seats.append(cls(
                    showtime=showtime,
                    seat_number=seat_number,
                    row_label=row_label,
                    row_index=row_index,
                    seat_index=seat_index
                ))
                created += 1
            if created >= total_capacity:
                break

        if seats:
            cls.objects.bulk_create(seats)
