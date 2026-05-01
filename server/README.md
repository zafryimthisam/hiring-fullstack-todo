# Todo App Backend

The backend server for the TODO application, built with Express.js and MongoDB.

## Tech Stack

- **Express.js** - Web framework for Node.js
- **MongoDB** - NoSQL database for storing TODO tasks
- **Mongoose** - MongoDB object modeling for Node.js

## Prerequisites

- Node.js
- MongoDB (local installation or cloud service like MongoDB Atlas)

## Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install the required dependencies:

```bash
npm install
```

3. Create a `.env` file in the server directory and add the following environment variables:

```env
PORT=3000
MONGODB_URL=your-connection-string-here
```

**Note:** Replace `your-connection-string-here` with your actual MongoDB connection string.

4. Start the development server:

```bash
npm run dev
```

You should see successful connection messages like:

- "TODO server listening on PORT: 3000"
- "Mongoose connected"

## API Endpoints

The server exposes the following REST API endpoints:

### Base URL

```
http://localhost:3000
```

### Endpoints

#### GET /

- **Description**: Welcome message
- **Response**: `"Welcome to TODO app Server!"`

#### GET /api/todos

- **Description**: Retrieve all TODO items
- **Response**: Array of TODO objects

```json
[
  {
    "_id": "todo_id",
    "title": "Sample Todo",
    "description": "Sample description",
    "done": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/todos

- **Description**: Create a new TODO item
- **Request Body**:

```json
{
  "title": "New Todo Title",
  "description": "Todo description"
}
```

- **Response**: Created TODO object (201 status)

#### PUT /api/todos/:id

- **Description**: Update a TODO item (title and description)
- **Parameters**: `id` - TODO item ID
- **Request Body**:

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

- **Response**: Updated TODO object

#### PATCH /api/todos/:id/done

- **Description**: Toggle the done status of a TODO item
- **Parameters**: `id` - TODO item ID
- **Response**: Updated TODO object with toggled done status

#### DELETE /api/todos/:id

- **Description**: Delete a TODO item
- **Parameters**: `id` - TODO item ID
- **Response**:

```json
{
  "message": "Todo deleted successfully"
}
```
