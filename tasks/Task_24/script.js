function changeBackgroundByKey(){
    document.addEventListener('keydown', (event) => {
        switch(event.key){
            case '1':
                document.body.style.backgroundColor = 'red';
                break;
            case '2':
                document.body.style.backgroundColor = 'green';
                break;
            case '3':
                document.body.style.backgroundColor = 'blue';
                break;
            default:
                console.log('Invalid key pressed');
        }
    })
}

changeBackgroundByKey();