export async function sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data: any = {}
  ): Promise<any> {
    const notificationMessage = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data, // Dados extras, como o ID da operação ou ação para navegação
    };
  
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationMessage),
      });
      const resData = await response.json();
      console.log("Notificação enviada:", resData);
      return resData;
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      throw error;
    }
  }
  