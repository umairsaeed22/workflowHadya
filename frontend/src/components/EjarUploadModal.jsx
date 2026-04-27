import { useState, useEffect } from "react";

function EjarUploadModal({
  isOpen,
  onClose,
  onSubmit,
  contract
}) {
  const [hoFile, setHoFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (contract) {
      setAmount(contract.depositAmount || "");
    }
  }, [contract]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hoFile) return;

    const formData = new FormData();
    formData.append("hoFile", hoFile);
    formData.append("amount", amount);

    try {
      setSubmitting(true);

      await onSubmit(formData);

      /*
        small delay for smooth UX
      */
      setTimeout(() => {
        setSubmitting(false);
        onClose();
      }, 1500);

    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-4">
          Upload to Ejar
        </h2>

        {/* LOADING STATE */}
        {submitting ? (
          <div className="flex flex-col items-center justify-center py-10">
            
            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>

            {/* Text */}
            <p className="text-lg font-medium">
              Submitting to Ejar...
            </p>

            <p className="text-sm text-gray-500 mt-2">
              Please wait
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block mb-2 font-medium">
                HO File (PDF)
              </label>

              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setHoFile(
                    e.target.files[0]
                  )
                }
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Amount
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EjarUploadModal;