// Reusable Skeleton Loading Components

export function Skeleton({ className = '', variant = 'default' }) {
  const baseClass = 'animate-pulse bg-gray-200 rounded'
  
  const variants = {
    default: '',
    circle: 'rounded-full',
    text: 'h-4',
    title: 'h-6',
    button: 'h-10 rounded-lg',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32',
  }
  
  return <div className={`${baseClass} ${variants[variant]} ${className}`} />
}

// Skeleton for stat cards on dashboards
export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-24 h-8 mb-1" />
      <Skeleton className="w-32 h-4" />
    </div>
  )
}

// Skeleton for table rows
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="w-full h-4" />
        </td>
      ))}
    </tr>
  )
}

// Skeleton for a full table
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card p-0">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton className="w-20 h-4" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Skeleton for dashboard page
export function DashboardSkeleton() {
  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <Skeleton className="w-40 h-5 mb-4" />
          <Skeleton className="w-full h-64" />
        </div>
        <div className="card">
          <Skeleton className="w-40 h-5 mb-4" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
      
      {/* Table */}
      <TableSkeleton rows={5} cols={6} />
    </>
  )
}

// Skeleton for list/table pages
export function ListPageSkeleton({ cols = 6 }) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="w-48 h-7 mb-2" />
          <Skeleton className="w-64 h-4" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
      
      {/* Filters */}
      <div className="card flex items-center gap-4 mb-6">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-20 h-8 rounded-lg" />)}
        </div>
      </div>
      
      {/* Table */}
      <TableSkeleton rows={8} cols={cols} />
    </>
  )
}

// Skeleton for detail page with sidebar
export function DetailPageSkeleton() {
  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-40 h-4" />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card">
            <div className="flex justify-between mb-4">
              <div>
                <Skeleton className="w-48 h-6 mb-2" />
                <Skeleton className="w-32 h-4" />
              </div>
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <Skeleton className="w-16 h-3 mb-2" />
                  <Skeleton className="w-24 h-6" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Content Cards */}
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <Skeleton className="w-32 h-5 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <Skeleton className="w-24 h-5 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Skeleton
