export default function UnitsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Units
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Bootcamp ID: {params.id}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Units page coming soon.
      </p>
    </div>
  )
}
