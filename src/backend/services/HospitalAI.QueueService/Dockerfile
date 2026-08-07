FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5003
ENV ASPNETCORE_URLS=http://+:5003

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["services/HospitalAI.QueueService/HospitalAI.QueueService.csproj", "services/HospitalAI.QueueService/"]
COPY ["HospitalAI.Domain/HospitalAI.Domain.csproj", "HospitalAI.Domain/"]
COPY ["HospitalAI.Application/HospitalAI.Application.csproj", "HospitalAI.Application/"]
COPY ["HospitalAI.Infrastructure/HospitalAI.Infrastructure.csproj", "HospitalAI.Infrastructure/"]
RUN dotnet restore "services/HospitalAI.QueueService/HospitalAI.QueueService.csproj"
COPY . .
WORKDIR "/src/services/HospitalAI.QueueService"
RUN dotnet build "HospitalAI.QueueService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HospitalAI.QueueService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HospitalAI.QueueService.dll"]
