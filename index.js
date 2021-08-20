const express = require('express');
const mysql = require('mysql');
var cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// let router = express.Router();

const accountsRoute = require('./router/accountsRoute');

const app = express();
const port = 3000;
// const upload = multer({ dest: './public/data/uploads/'});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tugas-akhir'
});

let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function(req, file, cb) {
    let fName = file.originalname.split('.');
    let ext = fName.pop();
    cb(null, Date.now() + '.' + ext);
  }
})

let upload = multer({ storage });

connection.connect();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.post('/register', (req, res) => {
  const {email, password, name} = req.body;
  connection.query(`INSERT INTO accounts (email, password, name) VALUES ('${email}', '${password}', '${name}')`, (err, rows, fields) => {
    if(err) throw err

    res.send(rows);
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  connection.query(`SELECT * FROM accounts WHERE email = '${email}' AND password = '${password}'`, (err, rows, fields) => {
    if(err) throw err
    let response = {
      success: rows.length === 1,
      data: rows
    };
    res.send(response);
  })
});

app.post('/accounts', upload.single('avatar'), (req, res) => {
  const { account_id, new_password, new_name } = req.body;
  const { destination, filename } = req.file;
  connection.query(`UPDATE accounts SET name = '${new_name}', avatar = '${ destination + filename }' WHERE account_id = ${account_id}`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/accounts/changePassword', (req, res) => {
  const { new_password, account_id } = req.body;
  
  connection.query(`update accounts set password = '${new_password}' where account_id = ${ account_id }`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/accounts/getPassword', (req, res) => {
  const { account_id } = req.body;
  connection.query(`select password from accounts where account_id = ${ account_id }`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows[0]);
  })
})

app.get('/accounts/:id', (req, res) => {
  connection.query(`select * from accounts where account_id = ${req.params.id}`, (err, rows, fields) => {
    res.send(rows);
  })
})

app.get('/accounts/avatar/:account_id', (req, res) => {
  const { account_id } = req.params;
  connection.query(`select avatar from accounts where account_id = ${ account_id }`, (err, rows, fields) => {
    let fileUrl = rows[0].avatar;
    if(fileUrl) {
      let [, , fileName] = fileUrl.split('/');
      res.download(fileUrl, fileName, e => {
        if(e) {
          res.sendStatus(404);
        }
        else {
          console.log('Sent:', fileName);
        }
      });
    }
    else {
      res.sendStatus(404);
    }
    
  })
})


// app.use('/accounts', accountsRoute);

app.get('/projects/all', (req, res) => { // all projects
  connection.query('select * from projects', (err, rows, fields) => {
    res.send(rows);
  });
})


app.get('/projects/:id', (req, res) => { 
  let response = {};
  connection.query(`select * from projects inner join accounts on accounts.account_id=projects.account_id where project_id = ${req.params.id}`, (err, rows, fields) => {
    connection.query(`select * from screenshots where project_id = ${req.params.id}`, (e, r, f) => {
      response = {...rows[0], screenshots: r};
      res.send(response);
    })
    // res.send(rows);
  });
})

app.get('/projects/:id/download', (req, res) => {
  connection.query(`select * from projects where project_id = ${req.params.id}`, (err, rows, fields) => {
    let fileUrl = rows[0].project_file;
    let [, , fileName] = fileUrl.split('/');

    // res.download(fileUrl, 'test.zip');

    res.download(fileUrl, fileName, e => {
      if(e) {
        res.sendStatus(404);
      }
      else {
        console.log('Sent:', fileName);
      }
    });
  });
})



app.get('/projects/user/:id', (req, res) => { // get all projects from user
  connection.query(`select * from projects where account_id = ${req.params.id}`, (err, rows, fields) => {
    res.send(rows);
  })
})

app.post('/projects/post', upload.array('project_file[]'), (req, res) => {
  const { title, description, visibility, account_id } = req.body;
  const { destination, filename } = req.files.pop();
  connection.query(`INSERT INTO projects (title, description, visibility, project_file, account_id) VALUES ('${title}', '${description}', '${visibility}', '${destination + filename}', ${account_id})`, (err, rows, fields) => {
    if(err) throw err
    let lastId = rows.insertId;
    req.files.map((file, i) => {
      let dest = file.destination;
      let name = file.filename;
      connection.query(`Insert into screenshots (image_file, project_id) values ('${ dest + name }', ${ lastId })`, (e, r, f) => {
        
      })
    })

    res.send(rows);
    
  })
})

app.post('/projects/edit', upload.single('project_file'), (req, res) => {
  const { title, description, visibility, project_id } = req.body;
  if(req.file) {
    const { destination, filename } = req.file;
    connection.query(`update projects set title = '${ title }', description = '${ description }', visibility = '${ visibility }', project_file = '${ destination + filename }' where project_id = ${ project_id }`, (err, rows, fields) => {
      if(err) throw err 
      res.send(rows);
    })
  }
  else {
    connection.query(`update projects set title = '${ title }', description = '${ description }', visibility = '${ visibility }' where project_id = ${ project_id }`, (err, rows, fields) => {
      if(err) throw err 
      res.send(rows);
    })
  }
})

app.get('/screenshot/:id', (req, res) => {
  connection.query(`select * from screenshots where screenshot_id = ${req.params.id}`, (err, rows, fields) => {
    let fileUrl = rows[0].image_file;
    let [, , fileName] = fileUrl.split('/');
    console.log(`fileName`, fileName);
    
    
    res.download(fileUrl, fileName, e => {
      if(e) {
        res.sendStatus(404);
      }
      else {
        console.log('Sent:', fileName);
      }
    });

    // res.sendFile(path.join(__dirname, fileUrl), e => {
    //   if(e) {
    //     res.sendStatus(404);
    //   }
    //   else {
    //     console.log('Sent:', fileUrl);
    //   }
    // })
  })
})

app.post('/follow', (req, res) => {
  const { account_id, following_id } = req.body;
  console.log('body', req.body);
  connection.query(`insert into followers (account_id, following_id) values ('${account_id}', '${following_id}')`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/unfollow', (req, res) => {
  const { account_id, following_id } = req.body;
  connection.query(`delete from followers where account_id=${account_id} and following_id=${following_id}`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })

})

app.post('/follow/status', (req, res) => {
  const { account_id, following_id } = req.body;
  console.log('body', req.body);
  connection.query(`select * from followers where account_id=${account_id} and following_id=${following_id}`, (err, rows, fields) => {
    if(err) throw err
    const followed = rows.length > 0;
    res.send({followed});
  })
})

app.get('/follow/count/:id', (req, res) => {
  const { id } = req.params;
  connection.query(`SELECT count(following_id) as follower_count from followers where following_id=${id}`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows[0]);
  })
})

app.get('/comments/:project_id', (req, res) => {
  const { project_id } = req.params;

  connection.query(`SELECT * FROM comments INNER JOIN accounts on accounts.account_id = comments.account_id WHERE project_id = ${project_id}`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/comment', (req, res) => {
  const { account_id, project_id, body } = req.body;

  connection.query(`insert into comments (body, account_id, project_id) values ('${body}', '${account_id}', '${project_id}')`, (err, rows, fields) => {
    if(err) throw err
    res.send({success: true, status: 201});
  })
})

app.post('/stats/view', (req, res) => {
  const { project_id } = req.body;

  connection.query(`insert into views (project_id) values (${project_id})`, (err, rows, fields) => {
    if(err) throw err
    res.send({success: true, status: 201});
  })
})

app.get('/stats/views/:id', (req, res) => {
  const { id } = req.params;
  connection.query(`SELECT COUNT(project_id) as views, view_date FROM views WHERE project_id=${ id } GROUP BY date(view_date)`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})
app.post('/stats/download', (req, res) => {
  const { project_id } = req.body;

  connection.query(`insert into downloads (project_id) values (${project_id})`, (err, rows, fields) => {
    if(err) throw err
    res.send({success: true, status: 201});
  })
})

app.get('/stats/downloads/:id', (req, res) => {
  const { id } = req.params;
  connection.query(`SELECT COUNT(project_id) as downloads, download_date FROM downloads WHERE project_id=${ id } GROUP BY date(download_date)`, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/likes', (req, res) => {
  const { project_id, account_id } = req.body;
  let query = `SELECT count(project_id) as like_count, 
    EXISTS(SELECT account_id from likes where account_id = ${ account_id }) as liked 
    FROM likes WHERE project_id = ${ project_id }`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    const { like_count } = rows[0];
    const liked = rows[0].liked ? true : false;
    let results = { like_count, liked };
    res.send(results);;
  })
})

app.post('/like', (req, res) => {
  const { project_id, account_id } = req.body;
  let query = `insert into likes(project_id, account_id) values (${ project_id }, ${ account_id })`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/unlike', (req, res) => {
  const { account_id } = req.body;
  let query = `delete from likes where account_id = ${ account_id }`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

// app.get('/accounts', (req, res) => {
//   connection.query('SELECT * FROM accounts', (err, rows, fields) => {
//     if(err) throw err
//     // console.log(rows.length);
//     res.send(rows.length);
//   });
// });


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});