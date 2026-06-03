class UsageService:
    _input_tokens = 0
    _output_tokens = 0
    _request_count = 0

    @classmethod
    def record(cls, usage):
        cls._input_tokens += usage.input_tokens
        cls._output_tokens += usage.output_tokens
        cls._request_count += 1

    @classmethod
    def get_stats(cls):
        return {
            "input_tokens": cls._input_tokens,
            "output_tokens": cls._output_tokens,
            "total_tokens": cls._input_tokens + cls._output_tokens,
            "request_count": cls._request_count,
        }
