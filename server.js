/*********************************************************************************
* WEB700 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Subhankar Dey   Student ID: sdey10 (129044228)   Date: 8th August 2023
* Github Link: https://github.com/sd3y10/A6
* Online (Cyclic) Link:  
*
********************************************************************************/ 


var express = require("express");
var path = require('path');
var collegeData = require('./modules/collegeData');

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const exphbs = require('express-handlebars');
var HTTP_PORT = process.env.PORT || 8080;


app.engine('.hbs', exphbs.engine({ extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
            '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
            return options.inverse(this);
            } else {
            return options.fn(this);
            }
        }
           
    }
}));

app.set('view engine', '.hbs');

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
   });


// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public'));

// setup a 'route' to listen on the default url path (http://localhost)
app.get('/', (req, res) => {
    res.render('home'); 
  });
  

app.get("/about", (req, res) => {
    res.render('about');
});

app.get("/htmlDemo", (req, res) => {
    res.render('htmlDemo');
});

app.get("/addStudent", (req, res) => {
    collegeData.getCourses()
    .then((courses) => {
    res.render("addStudent", { courses: courses });
    })
    .catch(() => {
    res.render("addStudent", { courses: [] });
    });
});

app.get("/addCourse", (req, res) => {
    res.render('addCourse');
});

app.post("/students/add", (req, res) => {
    collegeData.addStudent(req.body).then(
        res.redirect('/students')
    ).catch(function(reason){
        console.log(reason);
});
});

app.post("/student/update", (req, res) => {
    collegeData.updateStudent(req.body).then(
        res.redirect('/students')
    ).catch(function(reason){
        console.log(reason);
    });
   });

app.get("/students", function(req,res){
    collegeData.getAllStudents().then(
        function (data) {   
            if (data.length > 0) {
                res.render('students', { students: data });
              } else {
                res.render('students', { message: 'No results' });
              }
        }
        ).catch(function(reason){
            res.render("students", {message: "No results"});
        });
});


app.get("/courses", function(req,res){
    collegeData.getCourses().then(
        function (data) {
            if (data.length > 0) {
                res.render('courses', { courses: data });
              } else {
                res.render('courses', { message: 'No results' });
              }

          }
        ).catch(function(reason){
            res.render("courses", {message: "No results"});
    });
});

app.get("/course/:id", (req, res) => {
    collegeData.getCourseById(req.params.id).then(
    function (data) {   
        res.render("course", {course: data});

      }
    ).catch(function(reason){
        console.log(reason);
});
});

app.get("/student/:studentNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    collegeData.getStudentByNum(req.params.studentNum).then((data) => {
    if (data) {
        viewData.student = data; 
    } else {
        viewData.student = null; 
    }
    }).catch(() => {
        viewData.student = null; 
    }).then(collegeData.getCourses).then((data) => {
        viewData.courses = data;
    for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
            viewData.courses[i].selected = true;
        }
    }
    }).catch(() => {
        viewData.courses = []; // set courses to empty in case of an error
    }).then(() => {
    if (viewData.student == null) { 
        res.status(404).send("Student Not Found");
    } else {
        res.render("student", { viewData: viewData }); 
    }
    });
});

app.post('/courses/add', (req, res) => {
    const newCourseData = {
      courseCode: req.body.courseCode,
      courseDescription: req.body.courseDescription,
    };
  
    collegeData.addCourse(newCourseData)
          .then(() => {
            res.redirect('/courses');
          })
          .catch((error) => {
            console.error('Error:', error);
            res.render('addCourse', { message: 'Error adding course' });
          });
      
});

app.post("/course/update", (req, res) => {
    collegeData.updateCourse(req.body).then(
        res.redirect('/courses')
    ).catch(function(reason){
        console.log(reason);
    });
});

app.get('/course/delete/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
    
    collegeData.deleteCourseById(courseId)
        .then(() => {
            res.redirect('/courses');
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).send('Unable to Remove Course / Course not found');
        });
      
});

app.get('/student/delete/:studentNum', (req, res) => {
    const studentNum = parseInt(req.params.studentNum); 
    collegeData.deleteStudentByNum(studentNum)
        .then(() => {
            res.redirect('/students');
        })
        .catch(() => {
            res.status(500).send('Unable to Remove Student / Student not found');
        });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname,"/views/pnf.html"));
  });



// collegeData
//   .initialize()
//   .then(() => {
//     app.listen(HTTP_PORT, () => {
//       console.log("Server listening on port: " + HTTP_PORT);
//     });
//   })
//   .catch((err) => {
//     console.error("Error initializing data:", err);
//   });


collegeData.initialize().then(() =>{
    app.listen(HTTP_PORT, onHttpStart);
}).catch(error => {
    console.log(error);
});



