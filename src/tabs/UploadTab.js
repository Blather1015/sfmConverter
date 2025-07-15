// tabs/UploadTab.js
import React, { useRef } from 'react';

function UploadTab({
    handleFileUpload,
    handleSfmUpload,
    setFileType,
    setFileName,
    setJsonData,
    setColumns,
    setProuLangInput
}) {
    const fileInputRef = useRef(null);

    const handleUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setFileType('spreadsheet');

        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const csvData = e.target.result;
                const XLSX = require('xlsx');
                const workbook = XLSX.read(csvData, { type: 'string' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet);

                setJsonData(data);
                setColumns(data.length ? Object.keys(data[0]) : []);
            };
            reader.readAsText(file);
            return;
        }

        reader.onload = (e) => {
            const buffer = new Uint8Array(e.target.result);
            const XLSX = require('xlsx');
            const workbook = XLSX.read(buffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);

            setJsonData(data);
            setColumns(data.length ? Object.keys(data[0]) : []);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSfm = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const sfmText = e.target.result;
            const entries = sfmText.trim().split(/\n(?=\\lx )/);
            const rows = [];

            entries.forEach(entry => {
                const row = {};
                const lines = entry.trim().split('\n');

                lines.forEach(line => {
                    const match = line.match(/^\\(\w+)\s+(.*)$/);
                    if (match) {
                        const marker = match[1];
                        const content = match[2];

                        if (marker === 'ge') {
                            if (!row['ge']) row['ge'] = [];
                            row['ge'].push(content);
                        } else {
                            row[marker] = content;
                        }
                    }
                });

                rows.push(row);
            });

            const parsedRows = rows.map(row => {
                const flatRow = { ...row };
                if (Array.isArray(row.ge)) {
                    row.ge.forEach((g, i) => {
                        flatRow[`ge${i + 1}`] = g;
                    });
                    delete flatRow.ge;
                }
                return flatRow;
            });

            setFileType('sfm');
            setJsonData(parsedRows);
            setColumns(parsedRows.length ? Object.keys(parsedRows[0]) : []);
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h3>Upload Spreadsheet (.xlsx / .csv):</h3>
            <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                ref={fileInputRef}
            />

            <div style={{ marginTop: 10 }}>
                <h3>Upload SFM file (.sfm):</h3>
                <input
                    type="file"
                    accept=".sfm"
                    onChange={handleSfm}
                />
            </div>
        </div>
    );
}

export default UploadTab;