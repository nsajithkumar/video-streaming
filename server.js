const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const formidable = require("formidable");
const fs = require("fs");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("upload", {"result": ""});
});

app.post("/upload", (req, res) => {
    var form = new formidable.IncomingForm();
    
    form.parse(req, function (err, fields, files) {
        let videoName = fields.videoName;
        let oldpath = files.videoFile.path;

        let d = new Date();
        let timeStamp = d.getTime();

        var source = fs.createReadStream(oldpath);
        var dest = fs.createWriteStream('./public/videos/' + videoName + "_" + timeStamp + "_" + files.videoFile.name);

        source.pipe(dest);
        source.on('end', function() {
            res.render("upload", {"result": "Uploaded"});
        });

        source.on('error', function(err) {
            res.render("upload", {"result": "Not Uploaded"});
        });
    });
});

app.get("/videos", (req, res) => {

    let totalFiles = [];

    const testFolder = './public/videos';
    fs.readdirSync(testFolder).forEach(file => {
        totalFiles.push(file);
    });

    res.render("videos", {"videoList": totalFiles});
});

app.get("/viewVideo/:videoName", (req, res) => {
    const path = "./public/videos/" + req.params.videoName;

	const stat = fs.statSync(path)
	const fileSize = stat.size
	const range = req.headers.range
	if (range) {
		const parts = range.replace(/bytes=/, "").split("-")
		const start = parseInt(parts[0], 10)
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1
		const chunksize = (end-start)+1
		const file = fs.createReadStream(path, {start, end})
		const head = {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': 'video/mp4',
		}
		res.writeHead(206, head)
		file.pipe(res)
	} else {
		const head = {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
		}
		res.writeHead(200, head)
		fs.createReadStream(path).pipe(res)
    }
    
});

let port = process.env.PORT || 3000;
app.listen(port, (req, res) => {
    console.log("Server is listening to port : " + port);
});