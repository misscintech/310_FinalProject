
//holds all the function within our HTML forms
function showLoginForm()
{
    let form = document.getElementById("LOGIN_form");
    form.innerHTML = "<label> username </label><input type=\"text\" />" + 
    "<label>password</label><input type=\"text\"  />" + 
    "<button type=\"button\" onclick=\"resetForm()\">reset</button> <button type=\"submit\"onclick=\"LogIN()\">login</button> "
}

function resetForm()
{
    let form1 = document.getElementById("LOGIN_form");
    form1.innerHTML = "<button type=\"button\" onclick=\"showLoginForm()\"> login </button>" //+ "<button type=\"button\" onclick=\"createUser()\"> signup </button>"
}

function LogIN()
{
    //grants access to course content. <a> 

}
function createUser()
{
    let form2 = document.getElementById("SIGNUP_form");
    form2.innerHTML = "";
    return {
        // im assuming we return object to SQL table 
    }
}