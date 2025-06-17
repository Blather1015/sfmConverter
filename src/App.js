import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
    /* ------------------------------------------------------------------
     *  State
     * ----------------------------------------------------------------*/
    const [sfmContent, setSfmContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileNameInput, setFileNameInput] = useState('');

    const [jsonData, setJsonData] = useState([]);   // entire worksheet as JS objects
    const [columns, setColumns] = useState([]);     // column headers to populate <select>

    /* Language‑specific columns
       - index 0  → \lx  (vernacular / lexeme)
       - index ≥1 → \ge  (gloss / translation)
    */
    const [numLanguages, setNumLanguages] = useState(1);
    const [lxColumns, setLxColumns] = useState(['']);

    /* Other single‑value columns */
    const [psColumn, setPsColumn] = useState(''); // part‑of‑speech      (\ps)
    const [deColumn, setDeColumn] = useState(''); // definition          (\de)
    const [pcColumn, setPcColumn] = useState(''); // picture filename    (\pc)
    const [sfColumn, setSfColumn] = useState(''); // sound filename      (\sf)
    const [exColumn, setExColumn] = useState(''); // example sentence    (\ex)

    /* ------------------------------------------------------------------
     *  File import (xlsx, xls, csv)
     * ----------------------------------------------------------------*/
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        /* CSV ----------------------------------------------------------------*/
        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const csvData = e.target.result;
                const workbook = XLSX.read(csvData, { type: 'string' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet);

                setJsonData(data);
                setColumns(data.length ? Object.keys(data[0]) : []);
            };
            reader.readAsText(file);
            return;
        }

        /* Excel (xlsx, xls) ---------------------------------------------------*/
        reader.onload = (e) => {
            const buffer = new Uint8Array(e.target.result);
            const workbook = XLSX.read(buffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);

            setJsonData(data);
            setColumns(data.length ? Object.keys(data[0]) : []);
        };
        reader.readAsArrayBuffer(file);
    };

    /* ------------------------------------------------------------------
     *  UI handlers
     * ----------------------------------------------------------------*/
    const handleNumLanguagesChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value, 10) || 1);
        setNumLanguages(value);
        setLxColumns(Array(value).fill(''));
    };

    /* ------------------------------------------------------------------
     *  SFM conversion
     * ----------------------------------------------------------------*/
    const handleConvert = () => {
        const sfmText = jsonData.map((row) => {
            let entry = '';

            /* vernacular / lexeme (first language) */
            entry += `\\lx ${row[lxColumns[0]] || ''}\n`;

            /* additional languages become glosses */
            for (let i = 1; i < numLanguages; i++) {
                entry += `\\ge ${row[lxColumns[i]] || ''}\n`;
            }

            /* single‑column fields */
            if (exColumn) entry += `\\ex ${row[exColumn] || ''}\n`;
            if (psColumn) entry += `\\ps ${row[psColumn] || ''}\n`;
            if (deColumn) entry += `\\de ${row[deColumn] || ''}\n`;
            if (pcColumn) entry += `\\pc ${row[pcColumn] || ''}\n`;
            if (sfColumn) entry += `\\sf ${row[sfColumn] || ''}\n`;

            return entry;
        }).join('\n');

        setSfmContent(sfmText);
    };

    /* ------------------------------------------------------------------
     *  Download / Reset helpers
     * ----------------------------------------------------------------*/
    const handleDownload = () => {
        const base = fileName.replace(/\.[^/.]+$/, '') || 'converted';
        const name = (fileNameInput.trim() || base) + '.sfm';
        const blob = new Blob([sfmContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
    };

    const handleReset = () => {
        setSfmContent('');
        setFileName('');
        setJsonData([]);
        setColumns([]);

        setNumLanguages(1);
        setLxColumns(['']);

        setPsColumn('');
        setDeColumn('');
        setPcColumn('');
        setSfColumn('');
        setExColumn('');

        document.getElementById('fileInput').value = null;
    };

    /* ------------------------------------------------------------------
     *  Render
     * ----------------------------------------------------------------*/
    return (
        <div className="App">
            <h1>Excel / CSV → SFM Converter</h1>

            {/* ---------------------- File picker ---------------------- */}
            <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
            />

            {/* ---------------- Column mapping UI --------------------- */}
            {columns.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    {/* Number of languages */}
                    <h3>Number of languages:</h3>
                    <input
                        type="number"
                        min="1"
                        value={numLanguages}
                        onChange={handleNumLanguagesChange}
                    />

                    {/* Language column selectors */}
                    {Array.from({ length: numLanguages }).map((_, index) => (
                        <div key={index} style={{ marginTop: 10 }}>
                            <label>
                                {index === 0
                                    ? `Language 1 (vernacular) (\\lx)`
                                    : `Gloss ${index} (\\ge)`}
                                :
                            </label>
                            <select
                                value={lxColumns[index]}
                                onChange={(e) => {
                                    const next = [...lxColumns];
                                    next[index] = e.target.value;
                                    setLxColumns(next);
                                }}
                            >
                                <option value="">-- Select column --</option>
                                {columns.map((col) => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    {/* Example sentence */}
                    <div>
                        <label>Example sentence (\\ex):</label>
                        <select value={exColumn} onChange={(e) => setExColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* Remaining single‑value fields */}
                    <div>
                        <label>Part of speech (\\ps):</label>
                        <select value={psColumn} onChange={(e) => setPsColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Definition / description (\\de):</label>
                        <select value={deColumn} onChange={(e) => setDeColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Picture filename (\\pc):</label>
                        <select value={pcColumn} onChange={(e) => setPcColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Sound filename (\\sf):</label>
                        <select value={sfColumn} onChange={(e) => setSfColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleConvert} style={{ marginTop: 10 }}>
                        Convert to SFM
                    </button>
                </div>
            )}

            {/* --------------------- Result / Download ------------------ */}
            {sfmContent && (
                <div>
                    <h2>Conversion success 🎉</h2>

                    <div style={{ marginTop: 20 }}>
                        <label>Custom file name:</label>
                        <input
                            type="text"
                            value={fileNameInput}
                            onChange={(e) => setFileNameInput(e.target.value)}
                            placeholder={fileName ? fileName.replace(/\.[^/.]+$/, '') : 'converted'}
                            style={{ marginLeft: 10 }}
                        />
                    </div>

                    <button onClick={handleDownload}>Download .sfm file</button>
                    <button
                        onClick={handleReset}
                        style={{ marginLeft: 10, backgroundColor: '#dc3545' }}
                    >
                        Reset
                    </button>

                    <h3>Preview:</h3>
                    <pre className="sfm-preview">{sfmContent}</pre>
                </div>
            )}
        </div>
    );
}

export default App;
