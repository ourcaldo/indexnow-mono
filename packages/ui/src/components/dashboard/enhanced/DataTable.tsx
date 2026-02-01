import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTable<TData, TValue>({ 
  data, 
  columns, 
  pagination, 
  loading = false, 
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages ?? -1,
  })

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-muted border-b border-border">
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-border bg-muted/30">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.max(pagination.currentPage - 1, 1))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.max(pagination.currentPage - 1, 1))}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
