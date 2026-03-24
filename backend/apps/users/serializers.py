from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    has_password = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'photo', 'role', 'roles', 'is_active', 'created_at',
            'has_password'
        ]
        read_only_fields = ['id', 'role', 'roles', 'is_active', 'created_at']

    def get_has_password(self, obj):
        return obj.has_usable_password()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'photo'
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'photo']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Passwords do not match.'
            })
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    # πληρη στοιχεια χρηστη για admin panel
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'password', 'password_confirm',
            'phone', 'photo', 'role', 'roles', 'is_active',
            'is_staff', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        roles = data.get('roles')

        if password and password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        if roles is not None:
            if not isinstance(roles, (list, tuple)):
                raise serializers.ValidationError({'roles': 'Roles must be a list.'})
            valid_roles = set([choice[0] for choice in User.Role.choices])
            invalid = [r for r in roles if r not in valid_roles]
            if invalid:
                raise serializers.ValidationError({'roles': f'Invalid roles: {invalid}'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        if password:
            return User.objects.create_user(**validated_data, password=password)
        return User.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        roles = validated_data.get('roles')
        role = validated_data.get('role')
        if roles is not None and role and role not in roles:
            roles = list(roles) + [role]
            validated_data['roles'] = roles
        return super().update(instance, validated_data)
