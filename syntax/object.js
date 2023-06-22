var roles = {
    'programmer' : 'egoing',
    'designer' : 'k8805',
    'manager' : 'hoya'
}
console.log(roles.programmer);

for(var name in roles){
    console.log(name, roles[name]);
}