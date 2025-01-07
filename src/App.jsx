import { useState } from 'react'
import { SHA3 } from './components/sha3'
import './App.css'

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [file, setFile] = useState(null);
  const [bits, setBits] = useState(256);

  const standards = {
    224: { rate: 1152, capacity: 448 },
    256: { rate: 1088, capacity: 512 },
    384: { rate: 832, capacity: 768 },
    512: { rate: 576, capacity: 1024 },
  };

  const calculateHash = async () => {
    const sha3 = new SHA3(bits);
    
    let inputData;
    if (file) {
        const arrayBuffer = await file.arrayBuffer();
        inputData = new Uint8Array(arrayBuffer);
    } else {
        inputData = input; // Use text input if no file
    }

    const hash = sha3.absorb(inputData).squeeze();
    setOutput(Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  return (
    <div className="app-container">
      <h1>Implementacija SHA-3</h1>
      <div className="section">
        <div className="form-group">
          <label htmlFor="output-bits">Output Size (bits):</label>
          <select
            id="output-bits"
            className="input-field"
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
          >
            <option value={224}>224</option>
            <option value={256}>256</option>
            <option value={384}>384</option>
            <option value={512}>512</option>
          </select>
        </div>

        <div className="form-group">
          <p>Rate (r): {standards[bits].rate} bits</p>
          <p>Capacity (c): {standards[bits].capacity} bits</p>
        </div>

        <div className="form-group">
          <label htmlFor="input-text">Input Text:</label>
          <textarea
            id="input-text"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!file} // Disable text input if a file is selected
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="file-input">Upload File:</label>
          <input
            id="file-input"
            type="file"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setInput(''); // Clear text input when a file is selected
            }}
          />
        </div>

        <button className="button" onClick={calculateHash}>
          Calculate Hash
        </button>

        {output && (
          <div className="form-group">
            <label>SHA-3 Hash:</label>
            <div className="output-box">{output}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App