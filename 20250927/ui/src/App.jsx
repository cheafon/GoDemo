import {useState} from 'react'
import './App.css'
import Main from "./pages/main.jsx";

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <div className={'searchInput'}>
               <Main />
            </div>
        </>
    )
}

export default App
