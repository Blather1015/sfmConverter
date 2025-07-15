// App.js
import React, { useState, useRef } from 'react';
import UploadTab from './tabs/UploadTab';
import MappingTab from './tabs/MappingTab';
import ConvertTab from './tabs/ConvertTab';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('upload');
    const [sfmContent, setSfmContent] = useState('');
    const [liftContent, setLiftContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileNameInput, setFileNameInput] = useState('');

    const [jsonData, setJsonData] = useState([]);
    const [columns, setColumns] = useState([]);

    const [numLanguages, setNumLanguages] = useState(1);
    const [lxColumns, setLxColumns] = useState(['']);
    const [prouLangInput, setProuLangInput] = useState('');

    const [psColumn, setPsColumn] = useState('');
    const [deColumn, setDeColumn] = useState('');
    const [pcColumn, setPcColumn] = useState('');
    const [sfColumn, setSfColumn] = useState('');
    const [exColumn, setExColumn] = useState('');
    const [prouColumn, setProuColumn] = useState('');

    const [lxLabel, setLxLabel] = useState('lx');
    const [geLabels, setGeLabels] = useState(['ge']);
    const [fileType, setFileType] = useState('');

    const fileInputRef = useRef(null);

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
            if (prouColumn) entry += `\\prou ${row[prouColumn] || ''}\n`;
            return entry;
        }).join('\n');

        setLiftContent('');
        setSfmContent(sfmText);
    };

    const handleConvertLIFT = () => {
        if (!prouLangInput) {
            alert("Please insert a language for the 'Header Prou' field.");
            return;
        }
        const liftXml = generateLiftContent();
        setLiftContent(liftXml);
        setSfmContent('');
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

        const liftXml = generateLiftContent();
        const liftRangesXml = generateLiftRanges();

        const zip = new JSZip();
        zip.file(`${name}.lift`, liftXml);
        zip.file(`${name}.lift-ranges`, liftRangesXml);
        zip.folder('pictures');
        zip.folder('audio');

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `${name}_LIFT_Package.zip`);
        setLiftContent(liftXml);
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
        setLiftContent('');
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
        setProuColumn('');
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const generateLiftContent = () => {
        return `<?xml version="1.0" encoding="UTF-8"?>\n<lift version="0.13" producer="ExcelToLiftConverter">\n${jsonData.map((row) => {
            const guid = uuidv4();
            const entryId = `${row[lxColumns[0]] || 'entry'}_${guid}`;
            const lexicalUnit = `\n  <lexical-unit>\n    <form lang="${prouLangInput}">\n      <text>${row[lxColumns[0]] || ''}</text>\n    </form>\n  </lexical-unit>`;
            const trait = `<trait name="morph-type" value="stem" />`;
            const pronunciation = `\n  <pronunciation>\n    <form lang="${prouLangInput}"><text>${row[prouColumn]}</text></form>\n    <media href="${row[sfColumn]}.mp3"></media>\n  </pronunciation>`;
            const senses = lxColumns.slice(1).map((col, i) => {
                const gloss = row[col];
                if (!gloss) return '';
                const senseId = uuidv4();
                const mediaImage = row[pcColumn];
                return `\n  <sense id="${senseId}" order="${i}">\n    <gloss lang="en"><text>${gloss}</text></gloss>\n    ${i === 0 && mediaImage ? `<illustration href="${mediaImage}" />` : ''}\n  </sense>`;
            }).join('');
            return `<entry id="${entryId}" guid="${guid}" dateCreated="2025-06-25T23:43:31Z" dateModified="2025-06-25T23:43:31Z">\n${lexicalUnit}\n${trait}\n${pronunciation}\n${senses}\n</entry>`;
        }).join('\n')}\n</lift>`;
    };

    const generateLiftRanges = () => {
        return `<?xml version="1.0" encoding="UTF-8"?>\n<lift-ranges>\n  <range id="semantic-domain-ddp4" href="http://www.sil.org/semantic-domain/ddp-4" guid="some-guid">\n    <range-element guid="guid1" id="1.1" name="Universe, creation" />\n    <range-element guid="guid2" id="1.2" name="Sky" />\n  </range>\n</lift-ranges>`;
    };

    return (
        <div className="App">
            <h1>Excel / CSV ↔ SFM / LIFT Converter</h1>
            <h2>By Ravipas Panutatpinyo, Paparn Chongkolrattanapond</h2>

            <div className="tabs">
                <button onClick={() => setActiveTab('upload')}>Upload</button>
                <button onClick={() => setActiveTab('mapping')}>Mapping</button>
                <button onClick={() => setActiveTab('convert')}>Convert & Download</button>
            </div>

            <div className="tab-content">
                {activeTab === 'upload' && (
                    <UploadTab
                        handleFileUpload={() => { }}
                        handleSfmUpload={() => { }}
                        setFileType={setFileType}
                        setFileName={setFileName}
                        setJsonData={setJsonData}
                        setColumns={setColumns}
                        setProuLangInput={setProuLangInput}
                    />
                )}
                {activeTab === 'mapping' && (
                    <MappingTab
                        columns={columns}
                        numLanguages={numLanguages}
                        setNumLanguages={setNumLanguages}
                        lxColumns={lxColumns}
                        setLxColumns={setLxColumns}
                        geLabels={geLabels}
                        setGeLabels={setGeLabels}
                        exColumn={exColumn}
                        setExColumn={setExColumn}
                        psColumn={psColumn}
                        setPsColumn={setPsColumn}
                        deColumn={deColumn}
                        setDeColumn={setDeColumn}
                        pcColumn={pcColumn}
                        setPcColumn={setPcColumn}
                        sfColumn={sfColumn}
                        setSfColumn={setSfColumn}
                        prouColumn={prouColumn}
                        setProuColumn={setProuColumn}
                        prouLangInput={prouLangInput}
                        setProuLangInput={setProuLangInput}
                        fileType={fileType}
                        lxLabel={lxLabel}
                        setLxLabel={setLxLabel}
                    />
                )}
                {activeTab === 'convert' && (
                    <ConvertTab
                        fileNameInput={fileNameInput}
                        setFileNameInput={setFileNameInput}
                        sfmContent={sfmContent}
                        liftContent={liftContent}
                        handleConvert={handleConvert}
                        handleConvertLIFT={handleConvertLIFT}
                        handleExportToExcel={handleExportToExcel}
                        handleDownload={handleDownload}
                        handleLiftDownload={handleLiftDownload}
                        handleReset={handleReset}
                        fileType={fileType}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
