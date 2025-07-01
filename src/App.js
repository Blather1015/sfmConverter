import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
    const [sfmContent, setSfmContent] = useState('');
    const [liftContent, setLiftContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileNameInput, setFileNameInput] = useState('');

    const [jsonData, setJsonData] = useState([]);
    const [columns, setColumns] = useState([]);

    const [numLanguages, setNumLanguages] = useState(1);
    const [lxColumns, setLxColumns] = useState(['']);

    const [psColumn, setPsColumn] = useState('');
    const [deColumn, setDeColumn] = useState('');
    const [pcColumn, setPcColumn] = useState('');
    const [sfColumn, setSfColumn] = useState('');
    const [exColumn, setExColumn] = useState('');

    const [lxLabel, setLxLabel] = useState('lx');
    const [geLabels, setGeLabels] = useState(['ge']);
    const [fileType, setFileType] = useState('');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setFileType('spreadsheet');

        const reader = new FileReader();

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

    const handleNumLanguagesChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value, 10) || 1);
        setNumLanguages(value);
        setLxColumns(Array(value).fill(''));
        setGeLabels(Array(value - 1).fill('').map((_, i) => `ge${i + 1}`));
    };

    const handleConvert = () => {
        const sfmText = jsonData.map((row) => {
            let entry = '';
            entry += `\\lx ${row[lxColumns[0]] || ''}\n`;
            for (let i = 1; i < numLanguages; i++) {
                entry += `\\ge ${row[lxColumns[i]] || ''}\n`;
            }
            if (exColumn) entry += `\\ex ${row[exColumn] || ''}\n`;
            if (psColumn) entry += `\\ps ${row[psColumn] || ''}\n`;
            if (deColumn) entry += `\\de ${row[deColumn] || ''}\n`;
            if (pcColumn) entry += `\\pc ${row[pcColumn] || ''}\n`;
            if (sfColumn) entry += `\\sf ${row[sfColumn] || ''}\n`;
            return entry;
        }).join('\n');

        setSfmContent(sfmText);
    };


    const handleConvertLIFT = () => {
        const liftXml = generateLiftContent(); // Get updated LIFT XML
        setLiftContent(liftXml);               // Set it for preview
    };





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



    const handleLiftDownload = async () => {
        const base = fileName.replace(/\.[^/.]+$/, '') || 'converted';
        const name = fileNameInput.trim() || base;

        const liftXml = generateLiftContent();  // generates .lift XML content
        const liftRangesXml = generateLiftRanges();  // your function to generate .lift-ranges

        const zip = new JSZip();
        zip.file(`${name}.lift`, liftXml);
        zip.file(`${name}.lift-ranges`, liftRangesXml);

        // Create empty folders
        zip.folder('pictures');
        zip.folder('audio');

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `${name}_LIFT_Package.zip`);

        setLiftContent(liftXml); // for preview
    };





    const handleExportToExcel = () => {
        const mappedData = jsonData.map((row) => {
            const newRow = {};
            Object.entries(row).forEach(([key, val]) => {
                if (key === 'lx') {
                    newRow[lxLabel || 'lx'] = val;
                } else if (key.startsWith('ge')) {
                    const geIndex = parseInt(key.replace('ge', ''), 10) - 1;
                    const label = geLabels[geIndex] || key;
                    newRow[label] = val;
                } else {
                    newRow[key] = val;
                }
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const name = (fileNameInput.trim() || 'from_sfm') + '.xlsx';
        XLSX.writeFile(workbook, name);
    };

    const handleReset = () => {
        setSfmContent('');
        setFileName('');
        setFileType('');
        setJsonData([]);
        setColumns([]);

        setNumLanguages(1);
        setLxColumns(['']);
        setGeLabels(['ge']);

        setPsColumn('');
        setDeColumn('');
        setPcColumn('');
        setSfColumn('');
        setExColumn('');

        document.getElementById('fileInput').value = null;
    };

    const parseSfm = (sfmText) => {
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

        return rows.map(row => {
            const flatRow = { ...row };
            if (Array.isArray(row.ge)) {
                row.ge.forEach((g, i) => {
                    flatRow[`ge${i + 1}`] = g;
                });
                delete flatRow.ge;
            }
            return flatRow;
        });
    };

    const handleSfmUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const sfmText = e.target.result;
            const rows = parseSfm(sfmText);
            setFileType('sfm');
            setJsonData(rows);
            setColumns(rows.length ? Object.keys(rows[0]) : []);
        };
        reader.readAsText(file);
    };


    const generateLiftContent = () => {
        const timestamp = new Date().toISOString();

        const entriesXml = jsonData.map((row, index) => {
            const mainForm = row[lxColumns[0]] || 'entry';
            const entryId = `${mainForm}_${uuidv4()}`;
            const entryGuid = entryId.split('_')[1];

            const lexicalUnit = `
    <lexical-unit>
        <form lang="th"><text>${mainForm}</text></form>
    </lexical-unit>`;

            const trait = `    <trait name="morph-type" value="stem" />`;

            const senses = lxColumns.slice(1).map((col, i) => {
                const gloss = row[col];
                if (!gloss) return '';
                const glossId = uuidv4();
                return `
    <sense id="${glossId}" order="${i}">
        <gloss lang="en"><text>${gloss}</text></gloss>
    </sense>`;
            }).join('');

            return `<entry dateCreated="${timestamp}" dateModified="${timestamp}" id="${entryId}" guid="${entryGuid}">
${lexicalUnit}
${trait}
${senses}
</entry>`;
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<lift version="0.13" producer="ExcelToLiftConverter">
${entriesXml}
</lift>`;
    };

    const generateLiftRanges = () => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<lift-ranges>
  <range id="semantic-domain-ddp4" href="http://www.sil.org/semantic-domain/ddp-4" guid="some-guid">
    <range-element guid="guid1" id="1.1" name="Universe, creation" />
    <range-element guid="guid2" id="1.2" name="Sky" />
    <!-- Add more semantic domain elements if needed -->
  </range>
</lift-ranges>`;
    };



    return (
        <div className="App">
            <h1>Excel / CSV ↔ SFM / LIFT Converter</h1>

            <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
            />

            <div style={{ marginTop: 10 }}>
                <h3>Upload SFM file (.sfm):</h3>
                <input
                    type="file"
                    accept=".sfm"
                    onChange={handleSfmUpload}
                />
            </div>

            {columns.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3>Number of languages:</h3>
                    <input
                        type="number"
                        min="1"
                        value={numLanguages}
                        onChange={handleNumLanguagesChange}
                    />

                    {Array.from({ length: numLanguages }).map((_, index) => (
                        <div key={index} style={{ marginTop: 10 }}>
                            <label>
                                {index === 0 ? `Language 1 (vernacular) (\\lx)` : `Gloss ${index} (\\ge)`}:
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

                    {/* ✅ Custom label inputs ONLY shown when fileType is 'sfm' */}
                    {fileType === 'sfm' && (
                        <div style={{ marginTop: 10 }}>
                            <label>Custom label for vernacular (\\lx):</label>
                            <input
                                type="text"
                                value={lxLabel}
                                onChange={(e) => setLxLabel(e.target.value)}
                                placeholder="lx"
                            />
                        </div>
                    )}

                    {fileType === 'sfm' && Array.from({ length: numLanguages - 1 }).map((_, index) => (
                        <div key={index} style={{ marginTop: 10 }}>
                            <label>{`Custom label for gloss ${index + 1} (\\ge):`}</label>
                            <input
                                type="text"
                                value={geLabels[index] || ''}
                                onChange={(e) => {
                                    const next = [...geLabels];
                                    next[index] = e.target.value;
                                    setGeLabels(next);
                                }}
                                placeholder={`ge${index + 1}`}
                            />
                        </div>
                    ))}

                    <div>
                        <label>Example sentence (\\ex):</label>
                        <select value={exColumn} onChange={(e) => setExColumn(e.target.value)}>
                            <option value="">-- Select column --</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

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
                    <button onClick={handleExportToExcel} style={{ marginLeft: 10 }}>
                        Export to Excel
                    </button>
                    <button onClick={handleConvertLIFT} style={{ marginLeft: 10 }}>
                        Convert to LIFT
                    </button>
                </div>
            )}

            {sfmContent && (
                <div>
                    <h2>SFM Conversion success 🎉</h2>

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
            {liftContent && (
                <div>
                    <h2>LIFT conversion success 🎉</h2>

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

                    <button onClick={handleLiftDownload}>Download .lift file</button>
                    <button
                        onClick={handleReset}
                        style={{ marginLeft: 10, backgroundColor: '#dc3545' }}
                    >
                        Reset
                    </button>

                    <h3>Preview:</h3>
                    <pre className="sfm-preview">{liftContent}</pre>
                </div>
            )}

        </div>
    );
}

export default App;
