from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Admin role only."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.has_role('ADMIN')
        )


class IsTicketManager(permissions.BasePermission):
    """Ticket managers and admins can both manage venues/movies."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.has_any_role(['ADMIN', 'TICKET_MANAGER'])
        )


class IsAdminOrSelf(permissions.BasePermission):
    """Users can access their own data, admins can access anyone's."""

    def has_object_permission(self, request, view, obj):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.has_role('ADMIN') or obj == request.user)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    For objects with a 'user' field - owners and admins only.
    Used by reservations/tickets.
    """

    def has_object_permission(self, request, view, obj):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.has_role('ADMIN') or obj.user == request.user)
        )
