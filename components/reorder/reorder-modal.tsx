import React, {useState} from 'react';
import {X} from 'lucide-react';
import {Button} from "@/components/ui/button";

interface ReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quantity: number, personInCharge: string) => void;
    itemDescription: string;
    unitOfMeasurement: string;
    dosage: string;
    stocksAvailable: number;
}

export function ReorderModal({
                                 isOpen,
                                 onClose,
                                 onSave,
                                 itemDescription,
                                 unitOfMeasurement,
                                 dosage,
                                 stocksAvailable
                             }: ReorderModalProps) {
    const [quantity, setQuantity] = useState<string>('');
    const [personInCharge, setPersonInCharge] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null;


    const handleSave = () => {
        setError('');
        setLoading(true)

        const qty = parseInt(quantity);

        if (!quantity || isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity greater than 0');
            return;
        }

        if (!personInCharge.trim()) {
            setError('Please enter person in charge');
            return;
        }

        onSave(qty, personInCharge.trim());
        handleClose();
        setLoading(false);
    };


    const handleClose = () => {
        setQuantity('');
        setPersonInCharge('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Quantity</h2>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500"/>
                    </button>
                </div>

                {/* Description */}
                <p className="mb-6 text-sm text-gray-600">
                    Enter how many quantity need for restocking.
                </p>

                {/* Item Details */}
                <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Item Description:</span>
                        <span className="text-sm text-gray-900">{itemDescription}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Unit of Measurement:</span>
                        <span className="text-sm text-gray-900">{unitOfMeasurement}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Dosage:</span>
                        <span className="text-sm text-gray-900">{dosage || 'NA'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Stocks Available:</span>
                        <span className="text-sm text-gray-900">{stocksAvailable}</span>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="mb-4 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Quantity: <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Person in Charge: <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={personInCharge}
                            onChange={(e) => setPersonInCharge(e.target.value)}
                            placeholder="Enter name"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">


                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 bg-transparent"
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        variant="outline"
                        onClick={handleSave}
                        className="flex-1"
                        disabled={loading}
                    >
                        Save
                    </Button>

                </div>
            </div>
        </div>
    );
}
