export default function Table({ columns, data }) {
  return (
    <table className="w-full bg-white rounded-lg shadow-sm">
      <thead className="bg-gray-100 text-gray-600">
        <tr>
          {columns.map((col) => (
            <th key={col} className="py-2 px-4 text-left">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b hover:bg-gray-50">
            {Object.values(row).map((val, j) => (
              <td key={j} className="py-2 px-4">{val}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
