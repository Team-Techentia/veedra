import { useAuth, } from "./auth/useAuth";
import { useModal, } from "./ui/useModal"
import { useOutsideClick, } from "./ui/useOutsideClick"
import { useDebouncedThrottle, } from "./reusable/useDebouceThrottle"
import { useFilter, } from "./reusable/useFilters"
import { usePagination, } from "./reusable/usePagination"
import { useResize, } from "./ui/useResize";
import { useTable, } from "./reusable/useTable"
import { useProduct } from "./entities/useProduct";

export {
    useAuth,
    useModal, useOutsideClick,
    useDebouncedThrottle, useFilter, usePagination, useResize, useTable,
    useProduct
}