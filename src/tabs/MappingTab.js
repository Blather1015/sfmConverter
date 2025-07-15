// tabs/MappingTab.js
import React from 'react';

function MappingTab({
    columns,
    numLanguages,
    setNumLanguages,
    lxColumns,
    setLxColumns,
    geLabels,
    setGeLabels,
    exColumn,
    setExColumn,
    psColumn,
    setPsColumn,
    deColumn,
    setDeColumn,
    pcColumn,
    setPcColumn,
    sfColumn,
    setSfColumn,
    prouColumn,
    setProuColumn,
    prouLangInput,
    setProuLangInput,
    fileType,
    lxLabel,
    setLxLabel
}) {
    return (
        <div>
            <h3>Number of languages:</h3>
            <input
                type="number"
                min="1"
                value={numLanguages}
                onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setNumLanguages(value);
                    setLxColumns(Array(value).fill(''));
                    setGeLabels(Array(value - 1).fill('').map((_, i) => `ge${i + 1}`));
                }}
            />

            <div>
                <label>Language for Header Prou:</label>
                <input
                    type="text"
                    value={prouLangInput}
                    onChange={(e) => setProuLangInput(e.target.value)}
                    placeholder="Example: th"
                    style={{ marginLeft: 10 }}
                />
            </div>

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
                <label>Pronunciation (\\prou):</label>
                <select value={prouColumn} onChange={(e) => setProuColumn(e.target.value)}>
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
        </div>
    );
}

export default MappingTab;
