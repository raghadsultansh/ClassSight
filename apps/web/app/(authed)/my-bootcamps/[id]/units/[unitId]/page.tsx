export default function UnitDetailsPage({ 
  params 
}: { 
  params: { id: string; unitId: string } 
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Unit Details
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Bootcamp ID: {params.id}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Unit ID: {params.unitId}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Unit details page coming soon.
      </p>
    </div>
  )
}
