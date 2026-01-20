import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaPlus, FaTrash, FaClock, FaCalendarAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Day mapping for the dropdown
const dayMap = [
  { label: "Monday", value: 1 }, { label: "Tuesday", value: 2 }, { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 }, { label: "Friday", value: 5 }, { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

export default function UpdateCourses({ course, onClose, onSave }) {
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  // Validation Schema
  const validationSchema = Yup.object({
    title: Yup.string().required("Course title is required"),
    description: Yup.string().required("Description is required"),
    categories: Yup.array().min(1, "Select at least one category"),
    duration: Yup.number().typeError("Must be a number").required("Duration is required"),
    courseCurriculum: Yup.string().required("Curriculum is required"),
    schedules: Yup.array().of(
      Yup.object({
        dayOfWeek: Yup.number().typeError("Day is required").required("Day is required"),
        startTime: Yup.string().required("Start time is required"),
        endTime: Yup.string().required("End time is required")
          .test("is-after-start", "End must be after start", function (value) {
            const { startTime } = this.parent;
            if (!startTime || !value) return true;
            return value > startTime;
          }),
      })
    ),
  });

  // ✅ CRITICAL FIX: Safety Check. Prevents crash if schedules is null.
  const safeSchedules = Array.isArray(course.schedules) ? course.schedules : [];

  const initialValues = {
    id: course.id,
    title: course.name || "",
    description: course.description || "",
    categories: course.categories || [],
    duration: course.totalSessions || 0,
    courseCurriculum: course.courseCurriculum || "",
    
    // ✅ CRITICAL FIX: Safe Mapping
    schedules: safeSchedules.map((s) => ({
      dayOfWeek: Number(s.dayOfWeek) || "", 
      startTime: s.startTime ? s.startTime.slice(0, 5) : "", 
      endTime: s.endTime ? s.endTime.slice(0, 5) : "",
    })),
  };

 const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const updatedData = {
        id: course.id,
        name: values.title,
        description: values.description,
        categories: values.categories,
        totalSessions: values.duration,
        courseCurriculum: values.courseCurriculum,
        schedules: values.schedules.map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      };
      
      // Call the API
      // Note: Make sure onSave handles the response correctly if it expects one
      await onSave(updatedData); 
      
      toast.success("Course updated successfully!");
      onClose(); 
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to update course";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed -inset-10 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Update Course</h2>
            <p className="text-sm text-gray-500 mt-1">Modifying course details.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <div className="p-8">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true} // ✅ CRITICAL FIX: Ensures form refreshes after save
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-8">
                
                {/* Basic Info */}
                <div className="space-y-6">
                    <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold border-b border-gray-100 pb-2 mb-4">Basic Information</h3>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title</label>
                        <Field name="title" className="w-full bg-gray-50 border border-gray rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 outline-none" />
                        <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1 pl-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <Field as="textarea" name="description" rows="4" className="w-full bg-gray-50 border border-gray rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                        <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1 pl-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Categories</label>
                        <div className="flex flex-wrap gap-2.5">
                            {["Web Development", "Programming", "Data Science", "Design", "Business"].map((cat) => (
                            <label key={cat} className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border ${values.categories.includes(cat) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                <input
                                type="checkbox"
                                checked={values.categories.includes(cat)}
                                onChange={(e) => {
                                    if (e.target.checked) setFieldValue("categories", [...values.categories, cat]);
                                    else setFieldValue("categories", values.categories.filter((c) => c !== cat));
                                }}
                                className="hidden"
                                />
                                {cat}
                            </label>
                            ))}
                        </div>
                        <ErrorMessage name="categories" component="div" className="text-red-500 text-xs mt-1 pl-1" />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                    <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold border-b border-gray-100 pb-2 mb-4">Course Details</h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Weeks)</label>
                        <div className="relative">
                            <Field name="duration" type="number" className="w-full bg-gray-50 border border-gray rounded-xl px-4 py-3 pl-10 text-gray-900 focus:bg-white focus:border-blue-500 outline-none" />
                            <FaCalendarAlt className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        </div>
                        <ErrorMessage name="duration" component="div" className="text-red-500 text-xs mt-1 pl-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Curriculum Overview</label>
                        <Field as="textarea" name="courseCurriculum" rows="4" className="w-full bg-gray-50 border border-gray rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                        <ErrorMessage name="courseCurriculum" component="div" className="text-red-500 text-xs mt-1 pl-1" />
                    </div>
                </div>

                {/* Schedule Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
                      <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold">Class Schedule</h3>
                  </div>
                  
                  <FieldArray name="schedules">
                    {({ push, remove }) => (
                      <div className="space-y-4">
                        {values.schedules.map((_, index) => (
                          <div key={index} className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                            
                            {/* Day Selector */}
                            <div className="sm:col-span-1">
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Day</label>
                              <Field as="select" name={`schedules[${index}].dayOfWeek`} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none cursor-pointer">
                                <option value="">Select Day</option>
                                {dayMap.map((d) => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </Field>
                              <ErrorMessage name={`schedules[${index}].dayOfWeek`} component="div" className="text-red-500 text-[10px] mt-1 pl-1" />
                            </div>

                            {/* Time Inputs */}
                            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Start Time</label>
                                    <div className="relative">
                                        <Field type="time" name={`schedules[${index}].startTime`} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-blue-500 outline-none" />
                                        <FaClock className="absolute left-3 top-3 text-gray-400 text-xs" />
                                    </div>
                                    <ErrorMessage name={`schedules[${index}].startTime`} component="div" className="text-red-500 text-[10px] mt-1 pl-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">End Time</label>
                                    <div className="relative">
                                        <Field type="time" name={`schedules[${index}].endTime`} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm focus:border-blue-500 outline-none" />
                                        <FaClock className="absolute left-3 top-3 text-gray-400 text-xs" />
                                    </div>
                                    <ErrorMessage name={`schedules[${index}].endTime`} component="div" className="text-red-500 text-[10px] mt-1 pl-1" />
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 border border-gray-100 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove Schedule"
                            >
                                <FaTrash size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={() => push({ dayOfWeek: "", startTime: "", endTime: "" })}
                          className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-semibold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                        >
                          <FaPlus size={12} /> Add Another Schedule
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 mt-8">
                  <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">Cancel</button>
                  <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg disabled:opacity-70 transition-all">
                    {loading ? "Updating..." : "Update Course"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}