function StatCard({ title, value, status ,icon }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-soft hover:shadow-card transition-all duration-200">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h4 className="text-[1rem] text-gray-600">{title}</h4>
          <h4 className="text-[1rem] text-gray-900">{value}</h4>
          <h5 className="text-[0.875rem]">{status}</h5>
        </div>
        <div className="p-2 flex justify-center items-center bg-primary-light text-white rounded-lg text-2xl text-[1.5rem]">
          {icon}
        </div>
      </div>
    </div>
  );
}
export default StatCard;  