class User{
    constructor(name, email){
        this.name = name;
        this.email = email;
    }
    getInfo(){
        console.log("Name: " + this.name);
        console.log("Email: " + this.email);
    }
}

const user1 = new User("Bob", "bob@gmail.com");
user1.getInfo();