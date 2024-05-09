document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit',(event)=>{
    event.preventDefault();
    send_email();
  })

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('.email-details').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  //Show the emails
  fetch(`/emails/${mailbox}`)
  .then(response =>{
    if(!response.ok){
      alert('Error');
      throw new Error('Error loading emails');
    }
    return response.json();
  })
   .then(emails => {
    if(emails.length === 0){
      document.querySelector('#emails-view').innerHTML += `<p>No emails founding</p>`;
      console.log('No emails founding');
    }
    else{
      const emailsView = document.querySelector('#emails-view');
      emails.forEach(email => {
        const emailDiv = document.createElement("div");
        emailDiv.id = `email-${email.id}`;
        const backgroundColor  = email.read ? "lightgrey" : "white";
        emailDiv.style.backgroundColor = backgroundColor;
        emailDiv.classList.add('email');
        emailDiv.innerHTML = `
            <span><strong>${email.sender}</strong></span>
              <span>${email.subject}</span>
              <span class="time"> ${email.timestamp}</span>
            `;
            // <span><strong>${email.recipients.join(", ")}</strong></span>

            emailDiv.addEventListener('click',(e)=>{
                show_email_details(email.id,mailbox,e);
              })
              emailsView.appendChild(emailDiv);
      });
    }
    }).catch(error=>{
      console.log(error);
    });
}

function send_email(){
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails',{
      method: 'POST',
      body:JSON.stringify({recipients:recipients,
      subject:subject,
      body:body})
    })
    .then(response => response.json())
    .then(result => {
       console.log(result);
       load_mailbox('sent');
     })
     .catch( error=>{
       console.log(error);
     })   
}

function show_email_details(emailId,mailbox,e) {
  e.preventDefault();
  // document.querySelectorAll('.mailbox-button').forEach(button => button.style.display = 'none');
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('.email-details').style.display = 'block';

  fetch(`/emails/${emailId}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Error loading email details');
    }
    return response.json();
  })
  .then(email => {
    const emailDetailsView = document.querySelector('.email-details');
    let archiveButton=''
    if (email.archived) {
      archiveButton = `<button class="btn btn-primary" id="unarchive-btn"><i class="bi bi-arrow-bar-up mx-1"></i>Unarchive</button>`;
  } else {
      if (mailbox === 'inbox') {
          archiveButton = `<button class="btn btn-primary" id="archive-btn"><i class="bi bi-archive mx-1"></i>Archive</button>`;
      }
  } 
        emailDetailsView.innerHTML = `
        <a href="" onclick='back_to_email()' class="mx-4"><i class="bi bi-arrow-left-circle-fill"></i></a>
        ${archiveButton}
        <p class="mt-2"><strong>From: </strong> ${email.sender}</p>
        <p><strong>To: </strong> ${email.recipients.join(", ")}</p>
        <p> <strong>Subject: </strong>${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <button class='btn btn-primary' id='reply-btn'>Reply</button>
        <hr>
        <p class="body-details"> ${email.body}</p>
      `;
  emailDetailsView.style.display = 'block';
  if(email.archived){
    document.getElementById('unarchive-btn').addEventListener('click',()=>unarchiveEmail(emailId));
  }
  else{
    document.getElementById('archive-btn').addEventListener('click',()=>archiveEmail(emailId));
  }

  if(!email.read){
    fetch(`/emails/${emailId}`,{
      method: 'PUT',
      body:JSON.stringify({read:true})
    })
   .then(response =>{
    if (!response.ok){
      throw new Error('Error loading email details');
    }
   })
   .catch(error => {
      console.error(error);
    });
  }
  document.getElementById('reply-btn').addEventListener('click',()=>replyToEmail(email))
  })
  .catch(error => {
    console.error(error);
  });
  
}

function archiveEmail(emailId){
  fetch(`/emails/${emailId}`,{
    method: 'PUT',
    body:JSON.stringify({archived:true})
  })
  .then(response =>{
    if (!response.ok){
      throw new Error('Error archiving email');
    }
    load_mailbox('inbox');
  })
 .catch(error => {
  console.error(error);
 })
}

function unarchiveEmail(emailId){
  fetch(`/emails/${emailId}`,{
    method: 'PUT',
    body:JSON.stringify({archived:false})
  })
  .then(response =>{
    if (!response.ok){
      throw new Error('Error unarchiving email');
    }
    load_mailbox('inbox');
  })
 .catch(error => {
  console.error(error);
 })
}
function replyToEmail(email){
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}\n\n`;
}

function back_to_email(){
  load_mailbox('inbox');
}



