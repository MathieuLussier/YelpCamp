const fs = require('fs');
const path = require('path');

const Campground = require("../models/campground");
const Comment = require("../models/comment");

const utils = require('../utils/date');


function Camground(name, image, description, price, username, iduser) {
    this.name = name;
    this.image = image;
    this.description = description;
    this.price = price;
    this.author = {
      username: username,
      id: iduser
    };
  };

module.exports.getCampgrounds = (req, res) => {
    // get all campgrounds from db
    Campground.find({}, (err, campgrounds) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      } else {
        res.render("campgrounds", {
          campgrounds: campgrounds,
          doctitle: "Camgrounds Page",
        });
      }
    });
  }

  module.exports.getCampground = function (req, res) {
    let id = req.params.id;
    Campground.findById(id).populate("comments").exec(function (err, foundCampground) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      } else  {
        res.render("show", {
          doctitle: "Show",
          campground: foundCampground,
          formatFromAgo: utils.formatFromAgo
        });
      }
    });
  }

  module.exports.postCampground = (req, res) => {
    const url = req.protocol + '://' + req.get('host');
    const imagePath = url + '/uploads/images/' + req.file.filename;

    let newCampground = new Camground (req.body.name, imagePath, req.body.description, req.body.price, req.user.username, req.user._id);
    Campground.create(newCampground, function (err, newlyCreated) {
      if (err) {
        req.flash("errorcampground", err.message);
        return res.redirect('back');
      }
      req.flash("success", "Successfully created new campground " + newlyCreated.name + " !");
      res.redirect(`/campgrounds/${newlyCreated._id}`);
    });
  }

  module.exports.postComment = function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      }
      Comment.create({
        text: req.body.comment,
        author: {
          id: req.user._id,
          username: req.user.username,
        }
      }, function (err, comment) {
        if (err) throw err;
        campground.comments.push(comment);
        campground.save();
        return res.redirect("/campgrounds/" + campground._id);
      });
    });
  }

  module.exports.postEditComment = function (req, res) {
    let newdata = {
      text: req.body.comment
    };
    Comment.findByIdAndUpdate(req.params.commentid, newdata ,function(err, comment){
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      }
      res.redirect("/campgrounds/" + req.params.id);
    });
  }

  module.exports.deleteComment = function (req, res) {
    Comment.findByIdAndRemove(req.params.commentid, function(err, comment){
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      }
      res.redirect("/campgrounds/" + req.params.id);
    });
  }

  module.exports.postEditCampground = function(req, res){
    const url = req.protocol + '://' + req.get('host');

    Campground.findById(req.params.id, function(err, foundcampground){
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      }

      const filename = foundcampground.image.replace(/^.*[\\\/]/, '');
      const filepath = path.join(__dirname, '/../public/uploads/images/', filename);

      const newData = {
        name: req.body.name,
        image: typeof req.file === 'undefined' ? foundcampground.image : url + '/uploads/images/' + req.file.filename,
        description: req.body.description,
        price: req.body.price
      };

      if (typeof req.file !== 'undefined') {
        try {
          fs.unlinkSync(filepath);
        } catch (e) {

        }
      }

      Campground.findByIdAndUpdate(req.params.id, newData, function(err, campground) {
          if (err) {
            req.flash("error", err.message);
            return res.redirect('back');
          }
          req.flash("success", "Successfully updated " + campground.name + " campground!");
          res.redirect("/campgrounds/" + req.params.id);
      });
    });
  }

  module.exports.deleteCampground = function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, deletedCampground){
      if (err) {
        req.flash("error", err.message);
        return res.redirect('back');
      }

      const filename = deletedCampground.image.replace(/^.*[\\\/]/, '');
      const filepath = path.join(__dirname, '/../public/uploads/images/', filename);

      try {
        fs.unlinkSync(filepath);
      } catch (e) {

      }

      req.flash("success", "Successfully deleted " + deletedCampground.name + " campground!");
      res.redirect("/campgrounds");
    });
  }
