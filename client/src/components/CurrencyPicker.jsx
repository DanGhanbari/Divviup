import React, { useState, useEffect, useRef } from 'react';
import { currencies, getSymbol } from '../utils/currencies';

const CurrencyPicker = ({ selectedCurrency, onSelect, label, minimal = false, buttonClassName = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredCurrencies = currencies.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (code) => {
        onSelect(code);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClassName || "w-full bg-white border border-gray-300 rounded-md py-2 px-3 flex items-center justify-between shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"}
            >
                {minimal ? (
                    <span className="font-bold text-gray-500 hover:text-indigo-600 transition flex items-center gap-1">
                        {getSymbol(selectedCurrency)}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down opacity-50"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                ) : (
                    <>
                        <span className="flex items-center">
                            <span className="font-bold mr-2 text-indigo-600">{getSymbol(selectedCurrency)}</span>
                            <span>{selectedCurrency}</span>
                        </span>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </>
                )}
            </button>

            {isOpen && (
                <div className={`absolute z-50 mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm ${minimal ? 'w-28' : 'w-full'}`}>
                    <div className="p-2 sticky top-0 bg-white border-b z-10">
                        <input
                            type="text"
                            className="w-full border rounded p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {filteredCurrencies.map((currency) => (
                        <div
                            key={currency.code}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${selectedCurrency === currency.code ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`}
                            onClick={() => handleSelect(currency.code)}
                        >
                            <div className="flex items-center">
                                <span className="w-6 font-bold text-gray-500">{currency.symbol}</span>
                                <span className="font-medium text-gray-900">{currency.code}</span>
                            </div>
                            {selectedCurrency === currency.code && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                    {filteredCurrencies.length === 0 && (
                        <div className="py-2 px-3 text-gray-500 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CurrencyPicker;
