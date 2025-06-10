import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
    const [sfmContent, setSfmContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [jsonData, setJsonData] = useState([]);
    const [columns, setColumns] = useState([]);

    const [lxColumn, setLxColumn] = useState('');
    const [geColumn, setGeColumn] = useState('');
    const [psColumn, setPsColumn] = useState('');
    const [deColumn, setDeColumn] = useState('');
    const [pcColumn, setPcColumn] = useState('');
    const [sfColumn, setSfColumn] = useState('');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const csvData = e.target.result;
                const workbook = XLSX.read(csvData, { type: 'string' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet);

                console.log('Parsed CSV Data:', data);

                setJsonData(data);
                setColumns(data.length > 0 ? Object.keys(data[0]) : []);
            };

            reader.readAsText(file);
        } else {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const dataJson = XLSX.utils.sheet_to_json(worksheet);

                console.log('Parsed Excel Data:', dataJson);

                setJsonData(dataJson);
                setColumns(dataJson.length > 0 ? Object.keys(dataJson[0]) : []);
            };

            reader.readAsArrayBuffer(file);
        }
    };

    const handleConvert = () => {
        const sfmText = jsonData.map((row) => {
            return `\\lx ${row[lxColumn] || ''}\n\\ge ${row[geColumn] || ''}\n\\ps ${row[psColumn] || ''}\n\\de ${row[deColumn] || ''}\n\\pc ${row[pcColumn] || ''}\n\\sf ${row[sfColumn] || ''}\n`;
        }).join('\n');

        setSfmContent(sfmText);
    };

    const handleDownload = () => {
        const blob = new Blob([sfmContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.replace(/\.[^/.]+$/, '') + '.sfm';
        link.click();
    };

    const handleReset = () => {
        setSfmContent('');
        setFileName('');
        setJsonData([]);
        setColumns([]);
        setLxColumn('');
        setGeColumn('');
        setPsColumn('');
        setDeColumn('');
        document.getElementById('fileInput').value = null;
    };

    return (
        <div className="App">
            <h1>Excel/CSV to SFM Converter</h1>

            <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
            />

            {columns.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Select columns to map:</h3>

                    <div>
                        <label>Word (\lx):</label>
                        <select value={lxColumn} onChange={(e) => setLxColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Gloss/Translation (\ge):</label>
                        <select value={geColumn} onChange={(e) => setGeColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Part of Speech (\ps):</label>
                        <select value={psColumn} onChange={(e) => setPsColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Definition/Description (\de):</label>
                        <select value={deColumn} onChange={(e) => setDeColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Picture (\pc):</label>
                        <select value={pcColumn} onChange={(e) => setPcColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Sound (\sf):</label>
                        <select value={sfColumn} onChange={(e) => setSfColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>


                    <button onClick={handleConvert} style={{ marginTop: '10px' }}>Convert to SFM</button>
                </div>
            )}

            {sfmContent && (
                <div>
                    <h2>Conversion Success 🎉</h2>
                    <button onClick={handleDownload}>Download .sfm file</button>
                    <button onClick={handleReset} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>
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
