function Result() {
    const data = [
        { id: 1, name: '条目1', description: '描述1' },
        { id: 2, name: '条目2', description: '描述2' },
        { id: 3, name: '条目3', description: '描述3' }
    ];
    return (
        <div>
            {data.map(item=>(<div>{item.name}</div>))}
        </div>
    )
}

export default Result