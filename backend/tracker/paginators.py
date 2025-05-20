from rest_framework.pagination import PageNumberPagination
from math import ceil


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"  # Параметр для указания размера страницы в запросе
    page_query_param = "page"  # Параметр для указания номера страницы в запросе
    max_page_size = 100

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data['total_pages'] = ceil(self.page.paginator.count / self.page_size)
        response.data['current_page'] = self.page.number
        return response
