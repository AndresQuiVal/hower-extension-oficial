// function getFollowers(session) {
//     //

//     let username = document.getElementById('email').value;
//     const url = `https://www.instagram.com/graphql/query/?query_hash=37479f2b8209594dde7facb0d904896a&variables=%7B%22id%22:%221376364151%22,%22first%22:50,%22after%22:%22%22%7D -> get user followers`;
//     // const url = 'https://www.instagram.com/pypgroup/?__a=1&__d=dis';
//     const headers = new Headers({
//         // 'Content-Type': 'application/json',
//         'Cookie': session.cookies, // Set the cookies from the session,
//         'User-Agent' : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//     });

//     fetch(url, {
//         method: 'GET',
//         headers: headers,
//     })
//     .then(response => {
//         if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return response.text(); // Get the response text
//     })
//     .then(data => {
//         // const username = data.graphql.user.username;
//         // const fullName = data.graphql.user.full_name;
//         alert(data);

//         // Use the extracted data as needed
//         // document.getElementById("full-name").value = '';
//     })
//     .catch(error => alert('Sample Request Error:' + error));
// }