export interface InvoiceFilters {
  search: string
  dropdown: string
  status: string
  dateFrom: string
}

export interface InvoiceColumn<T> {
  key: keyof T
  label: string
  width: string
  sortable?: boolean
}

export interface InvoiceTableConfig<T> {
  columns: InvoiceColumn<T>[]
  renderCell: (invoice: T, column: keyof T) => React.ReactNode
  getInvoiceNumber: (invoice: T) => string
  getInvoiceStatus: (invoice: T) => string
  getInvoiceDate: (invoice: T) => string
  getInvoiceTotal: (invoice: T) => number
}

export interface FilterConfig {
  searchField: keyof InvoiceFilters
  searchPlaceholder: string
  dropdownField?: keyof InvoiceFilters
  dropdownOptions?: Array<{ value: string; label: string }>
  dropdownPlaceholder?: string
}
