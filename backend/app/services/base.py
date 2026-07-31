from typing import Generic, TypeVar
ModelType = TypeVar("ModelType")

class BaseService(Generic[ModelType]):
    pass
