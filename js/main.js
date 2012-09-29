// Setup

var App = {
	Models: {},
	Collections: {},
	Views: {},
	Instances: {},
	Variables: {},
}

// Models

App.Models.Movie = Backbone.Model.extend({});
App.Models.Genre = Backbone.Model.extend({});
App.Models.Comment = Backbone.Model.extend({});

// Variables
App.Variables.movies_base_url = 'http://movies.apidone.com/movies'
App.Variables.movies_url = 'http://movies.apidone.com/movies?_sort_by=rating_rotten_average&_sort_type=desc&genre=Comedy'
App.Variables.genre_url = 'http://movies.apidone.com/movies?_select_distinct=genre'

// Collections

App.Collections.Movies = Backbone.Collection.extend({
	model: App.Models.Movie
});
App.Collections.Genres = Backbone.Collection.extend({
	model: App.Models.Genre,
	comparator: function(genre) {
  		return genre.get("genre");
	}
});
App.Collections.Comments= Backbone.Collection.extend({
	model: App.Models.Comment
});

// Views
App.Views.MoviesList = Backbone.View.extend({
	el: '.movies-list',
	initialize: function(){
		$(this.el).html("");
		this.collection = new App.Collections.Movies();
		this.collection.bind('reset', this.render, this);
		this.collection.bind('add', this.render, this);
		this.collection.url = App.Variables.movies_url;
		this.collection.fetch();
	},
	render: function(){
		$(this.el).html("");
		this.collection.each(function(model){
			model.baseUrl = App.Variables.movies_base_url;
			this.addOne(model);
		}, this);
		$(this.el).css("width",(this.collection.length+1)*(390)+"px");
	},
	addOne: function(model) {
		model.rootUrl = App.Variables.movies_base_url;
		model.url = function(){return this.rootUrl+"/"+this.id;}
		var view = new App.Views.MovieListed({model: model});
		$(this.el).append(view.render().el);
	},
});

App.Views.MovieListed = Backbone.View.extend({
	tagName: 'li',
	className: 'movie-listed',
	template: _.template($('#tpl-movie-listed').html()),
	events: {
		"click": "selectMovie",
		'click .comments': 'showComments'
	},
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},
	showComments: function(e){
		$(".movie-comments", this.el).html("<div>Comments</div>");
	},
	selectMovie: function(e){
		$(".movie-listed").removeClass("open");
		$(this.el).addClass("open");
		$(".movie-comments").hide();
		$(".movie-comments", this.el).show();
		var model_url = this.model.url();
		this.comments = new App.Views.CommentsList({
			url: model_url+'/comments'
		});
		$(".movie-comments", this.el).html(this.comments.render().el);
		// var target = e.target;
		// if (target.tagName!="LI") {
		// 	target = $(target).parent();
		// }
		// $('.movie-listed').removeClass('selected');
		// $(target).addClass('selected');
		// new App.Views.MovieDetail({model: this.model});
	}
});

// App.Views.MovieDetail = Backbone.View.extend({
// 	tag: 'div',
// 	template: _.template($('#tpl-movie-detail').html()),
// 	initialize: function(){
// 		this.render();
// 	},
// 	render: function(){
// 		$(this.el).html(this.template(this.model.toJSON()));
// 		$('#movies-container .main').html(this.el);
// 	}
// });

App.Views.GenresList = Backbone.View.extend({
	tagName: 'ul',
	className: 'genre_select unstyled	',
	initialize: function(){
		$(this.el).html("");
		this.collection = new App.Collections.Genres();
		this.collection.bind('reset', this.render, this);
		this.collection.bind('add', this.render, this);
		this.collection.fetch({url: App.Variables.genre_url});
	},
	render: function(){
		var all_genres = new App.Models.Genre({'genre': 'All'})
		this.addOne(all_genres);
		this.collection.each(function(model){
			this.addOne(model);
		}, this);
		$('.genres-list').append(this.el);
	},
	addOne: function(model) {
		var view = new App.Views.GenreListed({model: model});
		$(this.el).append(view.render().el);
	}
});

App.Views.GenreListed = Backbone.View.extend({
	tagName: 'li',
	className: 'genre-item',
	template: _.template($('#tpl-genre-item').html()),
	events: {
		'click': 'changeGenre'
	},
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},
	changeGenre: function(e){
		$('.genre-item').removeClass('selected');
		$(e.target).addClass('selected');

		var genre = this.model.get("genre");
		App.Variables.movies_url = 'http://movies.apidone.com/movies?_sort_by=rating_rotten_average&_sort_type=desc'
		if(genre != "All"){
			App.Variables.movies_url+='&genre='+genre;
		}
		App.Instances.Views.movie_list.collection.fetch({url: App.Variables.movies_url});
	}
});

App.Views.CommentsList = Backbone.View.extend({
	tagName: 'ul',
	initialize: function(opts){
		$(this.el).html("");
		this.collection = new App.Collections.Comments();
		this.collection.bind('reset', this.render, this);
		this.collection.bind('add', this.render, this);
		this.collection.fetch({url: opts.url});
	},
	render: function(){
		this.collection.each(function(model){
			this.addOne(model);
		}, this);
		return this;
	},
	addOne: function(model) {
		var view = new App.Views.CommentListed({model: model});
		$(this.el).append(view.render().el);
	}
});

App.Views.CommentListed = Backbone.View.extend({
	tagName: 'li',
	className: 'comment-item',
	template: _.template($('#tpl-comment-item').html()),
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});

App.Instances.Views = {'movie_list': new App.Views.MoviesList()};
App.Instances.Views['genre_list'] = new App.Views.GenresList();