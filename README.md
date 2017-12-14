Please note that this is a development version.
Don't use this in production!

## Installation

Clone the repository locally.
`git clone https://github.com/ilmikko/xonig`

`cd xonig`

Install the required module dependencies.
`npm install`

Test that your installation works.
`npm test`

That's it!
Optionally you can also install mongodb on your machine and make the script point to the location to get database access (config file coming soon).

## Usage

You can configure the file pools to match specific mime types or directories.
The default mime types served as dynamic node scripts are 'text/node', which the server recognizes from the special '.node' extension.
You can think of this as equivalent to '.php'.

A .node file consists of typically HTML, but serverside JavaScript is wrapped inside blocks as follows:
<% console.log('Hello World!'); %>

Hence, you can have a file called index.node with the contents:
```
<html>
	<head>
		<title><% print('Title'); %></title>
	</head>
	<body>
		Hello there <%=DATA['name']%>!
	</body>
</html>
```

More information will follow later, but that's the basics.
