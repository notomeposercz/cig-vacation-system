import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface VacationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialDate: Date;
}

const VacationRequestModal: React.FC<VacationRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
}) => {
  // Validační schéma
  const validationSchema = Yup.object({
    startDate: Yup.date().required('Datum začátku je povinné'),
    endDate: Yup.date()
      .required('Datum konce je povinné')
      .min(
        Yup.ref('startDate'),
        'Datum konce musí být stejné nebo pozdější než datum začátku'
      ),
    halfDayStart: Yup.boolean(),
    halfDayEnd: Yup.boolean(),
    type: Yup.string().required('Typ dovolené je povinný'),
    note: Yup.string(),
  });

  // Inicializace formiku
  const formik = useFormik({
    initialValues: {
      startDate: format(initialDate, 'yyyy-MM-dd'),
      endDate: format(initialDate, 'yyyy-MM-dd'),
      halfDayStart: false,
      halfDayEnd: false,
      type: 'vacation',
      note: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        ...values,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal obsah */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nová žádost o dovolenou
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={formik.handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Datum začátku */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Datum začátku
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.startDate && formik.errors.startDate ? (
                  <div className="mt-1 text-sm text-red-600">{formik.errors.startDate}</div>
                ) : null}
              </div>

              {/* Datum konce */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Datum konce
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.endDate && formik.errors.endDate ? (
                  <div className="mt-1 text-sm text-red-600">{formik.errors.endDate}</div>
                ) : null}
              </div>

              {/* Půlden začátek */}
              <div className="sm:col-span-1">
                <div className="flex items-center">
                  <input
                    id="halfDayStart"
                    name="halfDayStart"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formik.values.halfDayStart}
                    onChange={formik.handleChange}
                  />
                  <label htmlFor="halfDayStart" className="ml-2 block text-sm text-gray-700">
                    Půlden (začátek)
                  </label>
                </div>
              </div>

              {/* Půlden konec */}
              <div className="sm:col-span-1">
                <div className="flex items-center">
                  <input
                    id="halfDayEnd"
                    name="halfDayEnd"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formik.values.halfDayEnd}
                    onChange={formik.handleChange}
                  />
                  <label htmlFor="halfDayEnd" className="ml-2 block text-sm text-gray-700">
                    Půlden (konec)
                  </label>
                </div>
              </div>

              {/* Typ dovolené */}
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Typ nepřítomnosti
                </label>
                <select
                  id="type"
                  name="type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                >
                  <option value="vacation">Dovolená</option>
                  <option value="sick_leave">Nemoc</option>
                  <option value="other">Jiné</option>
                </select>
                {formik.touched.type && formik.errors.type ? (
                  <div className="mt-1 text-sm text-red-600">{formik.errors.type}</div>
                ) : null}
              </div>

              {/* Poznámka */}
              <div className="sm:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Poznámka
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formik.values.note}
                  onChange={formik.handleChange}
                ></textarea>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={onClose}
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:text-sm"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Ukládání...' : 'Vytvořit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VacationRequestModal;
