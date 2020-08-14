# Tickets

## About
Tickets is a [Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) app to enable the integration between [RapidPro](https://github.com/rapidpro/rapidpro) ticketing service and the Rocket.Chat Omnichannel (Livechat) feature.

## Installation

### Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node](https://nodejs.org/en/download/)
- [RC-Apps](https://docs.rocket.chat/apps-development/getting-started#rocket-chat-app-engine-cli)

To install manually on your Rocket.Chat instance you first need to enable the installation of apps in development mode at `Administration > General > Apps > Enable development mode`.

1. Clone the repository and change directory:

```bash=
    git clone https://github.com/Ilhasoft/Rocket.Chat.App-Tickets
    cd Rocket.Chat.App-Tickets
```

2. Install the required packages:

```bash=
    npm install
```

3. Deploy the App:

```bash=
    rc-apps deploy
```

- Then the CLI will prompt you to insert:
    - `Server's URL`: Is your Rocket.Chat instance URL (if running Rocket.Chat locally,  insert `localhost:<PORT>`)
    - `username`: Is the username of the Rocket.Chat admin
    - `password`: Is the password of the Rocket.Chat admin

Refer to this [guide](https://docs.rocket.chat/apps-development/getting-started) if you need more info.

## App Setup

1. With the app installed, and with the `secret` provided on the Rocket.Chat ticket service integration on RapidPro, go to `Administration > Apps > this app`, and paste the `secret` on the `App's Secret` field, then click `Save Changes`.

3. Return to RapidPro, and proceed with the integration setup after setting the `App's Secret` field. This will automatically validate the integration between the app and RapidPro.

## API Reference

The following headers are required in for all incoming requests to ensure the requests being made from the intended rapidpro integration.

```json=
Content-Type:  application/json
Authorization: Token LHHKXX8ZMJTVUFAHSW2J5P6FSF4SCQRK
```

Error responses are returned in this pattern:

```json=
{
    "error": "error details message"
}
```

- ### GET /secret.check
    
    - Description:
        - Match the given secret from `Authorization` header with the App's `App Secret` field.
    - Result:
        - Status: `200 OK`

- ### PUT /settings

    - Description: 
        - Sets the given settings on app.
    - Payload:
        ```json=
        {
            "webhook": {
                "url": "https://<host>/mr/tickets/types/rocketchat/event_callback/<UUID>"
            }
        }
        ```
    - Result:
        - Status: `204 No Content`

- ### GET /room
    - Description:
        - Creates a livechat room to the given visitor
    - Payload:
        ```json=
        {
            "ticketID": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "sessionStart": "2020-07-17T10:28-03:00",
            "visitor": {
                "token": "1234",
                "contactUUID": "88ff1e41-c1f8-4637-af8e-d56acbde9171",
                "deparment": "IT Support",
                "name": "John Doe",
                "email": "john.doe@acmo.com",
                "phone": "+15417543010",
                "customFields": {
                    "foo": "bar",
                    "bar": "foo",
                }
            }
        }
        ```
    - Result:
        - Status: `200 OK`
        - Body:
        ```json=
        {
            "id": "onrMgdKbpX9Qqtvoi"
        }
        ```
        
- ### GET /room.close

    - Description:
        - Closes the livechat room from the given visitor.
    - Payload:
        ```json=
        {
            "visitor": {
                "token": "1234",
            }
        }
        ```
    - Result:
        - Status: `204 No Content`

- ### POST /visitor-message
    - Description:
        - Receives the visitor message and forwards to its assigned agent.
    - Payload:
        ```json=
        {
            "visitor": {
                "token": "1234",
            },
            "text": "Can you help me?"
        }
        ```
    - Result:
        - Status: `201 Created`
        - Body:
        ```json=
        {
            "id": "iNKE8a6k6cjbqWhWd"
        }
        ```

### Webhooks

There are currently 2 configured webhooks on the app.

The following headers are required in for all webhooks to ensure the requests are being made from the intended RapidPro integration.

```json=
Content-Type:  application/json
Authorization: Token LHHKXX8ZMJTVUFAHSW2J5P6FSF4SCQRK
```

#### POST <callback_url>
    
- Agent Message:
    - Description:
        - Triggered when the agent sends a message to the visitor.
    - Payload:
        ```json=
        {
            "type": "agent-message",
            "ticketID": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "visitor": {
                "token": "1234"
            },
            "data": {
                "text": "",
            }
        }
        ``` 
- Room Closing:
    - Description:
        - Triggered when a livechat room is closed.
    - Payload:
        ```json=
        {
            "type": "close-room",
            "ticketID": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "visitor": {
                "token": "1234",
            }
        }
        ```
